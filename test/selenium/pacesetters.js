/* eslint-env node, mocha */
const assert = require('assert');

// Helpers
const driverWrapper = require('./helpers/driver.js');
const compute = require('./helpers/compute.js');
const csv = require('./helpers/csv.js');

// const tableTemplate = require('../../client/app/data/pacesetters.js');

// import test API
const session = require('./api/session.js');
const manage = require('./api/manage.js');
const submission = require('./api/submission.js');
const unmasking = require('./api/unmasking.js');

const UPLOAD_FILE = '/test/selenium/files/pace2.xlsx';

describe('Pacesetters Tests', function () {
  this.timeout(2500000);

  // Create the chrome driver before tests and close it after tests
  before(function () {
    driverWrapper.create();
  });
  after(function () {
    driverWrapper.quit();
  });

  // End-to-end Workflow
  describe('End-to-end Workflow', function () {
    let sessionKey, password, links, driver, inputs, clientCohortMap;

    const COHORT_COUNT = 5;
    // const COHORT_COUNT = tableTemplate.cohorts.length;
    const CONTRIBUTOR_COUNT = 35;
    const RESUBMISSION_COUNT = 10;
    // const COHORT_SIZE_THRESHOLD = tableTemplate.cohort_threshold; (no threshold needed for pacesetters?)

    before(function () {
      driver = driverWrapper.getDriver();
      inputs = { all: [] };
    });

    // Create session
    it('Session Creation', async function () {
      let returned = await session.createSession(driver);
      sessionKey = returned.sessionKey;
      password = returned.password;
    });

    // Generate Participation Links
    it('Generate Links', async function () {
      await manage.login(driver, sessionKey, password); // Login to Session Management
      await manage.createCohorts(driver, COHORT_COUNT);
      links = await manage.generateLinksByCohort(driver, CONTRIBUTOR_COUNT, COHORT_COUNT);
    });

    // Start Session
    it('Start Session', async function () {
      await manage.changeSessionStatus(driver, 'start');
    });

    // Submit
    it('Data Submissions', async function () {
      clientCohortMap = {};
      let subNumber = 0;
      for (let cohort = 0; cohort < COHORT_COUNT; cohort++) {
        const cohortInputs = inputs[cohort+1] || [];
        for (let i = 0; i < links[cohort].length; i++) {
          subNumber += 1;
          // const uploadFile = UPLOAD_FILE;
          const uploadFile = (subNumber-1) % 3 === 0 ? UPLOAD_FILE : undefined;

          const submissionID = '\tSubmission: ' + subNumber + '. Cohort: ' + (cohort+1) + '. ' + (uploadFile == null ? 'Manual' : 'Upload');
          console.time(submissionID);
          const input = await submission.submitCohortSelf(driver, links[cohort][i], cohort, uploadFile);
          console.timeEnd(submissionID);

          // Add input to inputs
          cohortInputs.push(input);
          inputs['all'].push(input);

          // Remember cohort
          clientCohortMap[subNumber-1] = { cohort: cohort, index: cohortInputs.length-1 };
        }
        // console.log('after inner loop ', cohortInputs);
        inputs[cohort+1] = cohortInputs;
      }
      // console.log('links ', links);
      // console.log('inputs ', inputs);
      // console.log('clientCohortMap ', clientCohortMap);
    });

    // Resubmissions
    it('Data Resubmissions', async function () {
      const numPerCohort = Math.floor(CONTRIBUTOR_COUNT/COHORT_COUNT);
      for (let i = 0; i < RESUBMISSION_COUNT; i++) {
        // force the first party to first resubmit 3 times to randomly chosen (possibly overlapping) cohorts
        // just to test several resubmissions by the same party
        // other resubmissions are chosen randomly
        // const submitter = Math.floor(Math.random() * Object.keys(clientCohortMap).length);
        // console.log('sub ', submitter);
        const submitter = i < 3 ? 0 : Math.floor(Math.random() * Object.keys(clientCohortMap).length);
        const cohort = clientCohortMap[submitter]['cohort']; // zero-indexed cohort
        const subNumWithinCohort = submitter % numPerCohort; // because links are a dictionary for Pacesetters
        const link = links[cohort][subNumWithinCohort];

        // Randomly choose upload or manually (with equal likelihood)
        const uploadFile = Math.random() < 0.5 ? UPLOAD_FILE : undefined;

        // Logging message
        const submissionID = '\tResubmission #: ' + (i+1) + '. Replacing: ' + (submitter+1)
          + '. Cohort: ' + (cohort+1) + (uploadFile == null ? ' Manual' : ' Upload');

        // Resubmit
        console.time(submissionID);
        const input = await submission.submitCohortSelf(driver, link, cohort, uploadFile);
        console.timeEnd(submissionID);

        // Add new input to inputs
        const cohortInputs = inputs[cohort+1] || []; // for by-cohort inputs, the cohort number must be one-indexed
        cohortInputs.push(input);
        inputs[cohort+1] = cohortInputs;
        inputs['all'][submitter] = input; // replace old input

        // Remove previous submission in cohort
        var oldCohortIndex = clientCohortMap[submitter]['index'];
        inputs[cohort+1][oldCohortIndex] = null;
        clientCohortMap[submitter] = { cohort: cohort, index: cohortInputs.length-1 };
      }

      // remove nulls
      for (let i = 0; i < COHORT_COUNT; i++) {
        if (inputs[i+1] == null) {
          inputs[i + 1] = [];
        }
        inputs[i + 1] = inputs[i + 1].filter(input => input != null);
      }
      await driver.sleep(1000);
    });

    // Stop session
    it('Stop Session', async function () {
      await manage.login(driver, sessionKey, password);
      await manage.changeSessionStatus(driver, 'stop');
    });

    // Verify History is correct with all resubmissions
    it('Verify History', async function () {
      const history = await manage.getHistory(driver, COHORT_COUNT);
      for (let cohort = 1; cohort <= COHORT_COUNT; cohort++) {
        assert.equal(history[cohort], (inputs[cohort] || []).length, 'Incorrect submission count in history for cohort ' + cohort);
      }
    });

    // Verify participation link are *exactly* the same (including order)
    it('Verify Participation Links', async function () {
      const newLinks = await manage.getExistingLinksByCohorts(driver, COHORT_COUNT);
      assert.deepEqual(newLinks, links, 'Participation links have changed after submission and resubmission');
    });

    // Sleep to give server time to finish processing
    it('Sleep 5 seconds', async function () {
      await driver.sleep(5000); // Pacesetters math is faster, unmasking needs more sleep time
      // await driver.sleep(100000);
    });

    // Unmask
    it('Unmasking', async function () {
      const { averagesContent, deviationsContent } = await unmasking.unmask(driver, sessionKey, password, inputs['all'][0].length);
      // const { tablesContent, averagesContent, deviationsContent } = await unmasking.unmask(driver, sessionKey, password, inputs['all'][0].length);

      // Parse CSV and check results are correct
      const { cohorts: averagesCohorts, parsed: averages } = csv.parseCSVCohorts(averagesContent);
      const { cohorts: deviationsCohorts, parsed: deviations } = csv.parseCSVCohorts(deviationsContent);

      // Check cohorts are what we expected
      averagesCohorts.sort();
      deviationsCohorts.sort();
      const cohorts = Object.keys(inputs).filter(i => (i !== 'all')).sort();
      // const cohorts = Object.keys(inputs).filter(i => (i !== 'all' && inputs[i].length >= COHORT_SIZE_THRESHOLD)).sort();
      console.log('Cohorts:', cohorts, '/', COHORT_COUNT);

      assert.deepEqual(averagesCohorts, cohorts, 'Average CSV file does not have correct cohorts');
      assert.deepEqual(deviationsCohorts, cohorts, 'Standard Deviation CSV file does not have correct cohorts (should have only "all")');
      // assert.deepEqual(deviationsCohorts, [], 'Standard Deviation CSV file does not have correct cohorts (should have only "all")');

      // Verify results for UI
      // console.log('real avgs --> ', averages['all'].values);
      const allAverage = compute.computeAverage(inputs['all']);
      // console.log('fake avgs --> ', allAverage);
      // console.log(allAverage, '=================\n');
      // console.log('real dev ', deviations['all'].values);
      const allDeviation = compute.computeDeviation(inputs['all']);
      // assert.deepEqual(tablesContent, allAverage, 'UI Average over all cohorts is incorrect');

      // Verify results from csv
      assert.equal(averages['all'].count, inputs['all'].length, 'CSV Average over all cohorts has incorrect # of participants');
      assert.deepEqual(averages['all'].values, allAverage, 'CSV Average over all cohorts is incorrect');

      assert.equal(deviations['all'].count, inputs['all'].length, 'CSV Deviation over all cohorts has incorrect # of participants');
      assert.deepEqual(deviations['all'].values, allDeviation, 'CSV Deviation over all cohorts is incorrect');

      // Check each cohort
      for (const cohort of cohorts) {
        const cohortAverage = compute.computeAverage(inputs[cohort]);
        // const cohortAverage = compute.computeAverage(compute.reduceByGender(inputs[cohort]));
        assert.equal(averages[cohort].count, inputs[cohort].length, 'CSV Average - Cohort ' + cohort + ' has incorrect # of participants');
        assert.deepEqual(averages[cohort].values, cohortAverage, 'CSV Average - Cohort ' + cohort + ' has incorrect # of participants');
      }
    });
  });

  // describe('UI Tests', function () {
  //   this.timeout(15000);
  //   const CONTRIBUTOR_COUNT = 100;
  //   const UNASSIGNED_COHORT = '0';
  //
  //   let driver;
  //
  //   // Create the chrome driver before tests and close it after tests
  //   before(function () {
  //     driver = driverWrapper.getDriver();
  //   });
  //
  // TODO: figure out why empty session alert doesn't get read as the expected behavior

  //   // Test that creating a session with empty title/description gives errors
  //   describe('/create', function () {
  //     it('Empty session information', async function () {
  //       await session.createEmptySession(driver);
  //     });
  //   });
  //
  // NOTE: There is no option to download links in Pacesetters currently
  //   // Test that we can download participation links properly
  //   describe('/manage', function () {
  //     it('Download links', async function() {
  //       let returned = await session.createSession(driver);
  //       const sessionKey = returned.sessionKey;
  //       const password = returned.password;
  //       await manage.login(driver, sessionKey, password); // Login to Session Management
  //       // Ensure UI transition has finished
  //       await driver.sleep(500);
  //       await manage.downloadLinks(driver, UNASSIGNED_COHORT, 0);
  //       await driver.sleep(500);
  //       await manage.generateLinksNoCohorts(driver, CONTRIBUTOR_COUNT);
  //       await driver.sleep(500);
  //       await manage.downloadLinks(driver, UNASSIGNED_COHORT, CONTRIBUTOR_COUNT);
  //     });
  //   });
  // });
});
