/* eslint-env node, mocha */
const assert = require('assert');

// Helpers
const driverWrapper = require('./driver.js');
const compute = require('./compute.js');
const csv = require('./csv.js');

// import test API
const session = require('./api/session.js');
const manage = require('./api/manage.js');
const submission = require('./api/submission.js');
const unmasking = require('./api/unmasking.js');

const UPLOAD_FILE = '/test/selenium/files/bwwc.xlsx';

describe('BWWC Tests', function () {
  // Create the chrome driver before tests and close it after tests
  before(function () {
    driverWrapper.create();
  });
  after(function () {
    driverWrapper.quit();
  });


  describe('Resubmission', function () {
    let sessionKey, password, links, driver, inputs;

    const COHORT_COUNT = 2;
    const CONTRIBUTOR_COUNT = 2;

    before(function() {
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
      links = await manage.generateLinksNoCohorts(driver, CONTRIBUTOR_COUNT);
    });

    // Start Session
    it('Start Session', async function () {
      await manage.changeSessionStatus(driver, 'start');
    });

    // Submit
    it('Data Submissions', async function () {
      for (var i = 1; i <= COHORT_COUNT; i++) {
        await submission.submitCohort(driver, links, i, UPLOAD_FILE);
        await manage.login(driver, sessionKey, password);
        await manage.checkHistory(driver, i, CONTRIBUTOR_COUNT);
      }
    });
  });

  // End-to-end Workflow
  describe('End-to-end Workflow', function () {
    let sessionKey, password, links, driver, inputs;

    const COHORT_COUNT = 7;
    const CONTRIBUTOR_COUNT = 20;

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
      links = await manage.generateLinksNoCohorts(driver, CONTRIBUTOR_COUNT);
    });

    // Start Session
    it('Start Session', async function () {
      await manage.changeSessionStatus(driver, 'start');
    });

    // Submit
    it('Data Submissions', async function () {
      for (let i = 0; i < links.length; i++) {
        const cohort = (i % COHORT_COUNT) + 1;
        const uploadFile = i % 3 === 0 ? UPLOAD_FILE : undefined;

        const submissionID = '\tSubmission: ' + (i+1) + '. Cohort: ' + cohort + '. ' + (uploadFile == null ? 'Manual' : 'Upload');
        console.time(submissionID);
        const input = await submission.submitCohortSelf(driver, links[i], cohort, uploadFile);
        console.timeEnd(submissionID);

        // Add input to inputs
        const cohortInputs = inputs[cohort] || [];
        cohortInputs.push(input);
        inputs[cohort] = cohortInputs;
        inputs['all'].push(input);
      }
    });

      // Stop session
    it('Stop Session', async function () {
      await manage.login(driver, sessionKey, password);
      await manage.changeSessionStatus(driver, 'stop');
    });

    // Sleep to give server time to finish processing
    it('Sleep 20 seconds', async function () {
      await driver.sleep(20000);
    });

    // Unmask
    it('Unmasking', async function () {
      const { tablesContent, averagesContent, deviationsContent } = await unmasking.unmask(driver, sessionKey, password, inputs['all'][0].length);

      // Parse CSV and check results are correct
      const { cohorts: averagesCohorts, parsed: averages } = csv.parseCSVCohorts(averagesContent);
      const { cohorts: deviationsCohorts, parsed: deviations } = csv.parseCSVCohorts(deviationsContent);

      // Check cohorts are what we expected
      averagesCohorts.sort();
      deviationsCohorts.sort();
      const cohorts = Object.keys(inputs).filter(i => (i !== 'all' && (inputs[i] || []).length > 0)).sort();

      assert.deepEqual(averagesCohorts, cohorts, 'Average CSV file does not have correct cohorts');
      assert.deepEqual(deviationsCohorts, cohorts, 'Standard Deviation CSV file does not have correct cohorts');

      // Verify results for UI
      const allAverage = compute.computeAverage(inputs['all']);
      const allDeviation = compute.computeDeviation(inputs['all']);
      assert.deepEqual(tablesContent, allAverage, 'UI Average over all cohorts is incorrect');

      // Verify results from csv
      assert.equal(averages['all'].count, inputs['all'].length, 'CSV Average over all cohorts has incorrect # of participants');
      assert.deepEqual(averages['all'].values, allAverage, 'CSV Average over all cohorts is incorrect');

      assert.equal(deviations['all'].count, inputs['all'].length, 'CSV Deviation over all cohorts has incorrect # of participants');
      assert.deepEqual(deviations['all'].values, allDeviation, 'CSV Deviation over all cohorts is incorrect');

      // Check each cohort
      for (const cohort of cohorts) {
        const cohortAverage = compute.computeAverage(inputs[cohort]);
        assert.equal(averages[cohort].count, inputs[cohort].length, 'CSV Average - Cohort ' + cohort + ' has incorrect # of participants');
        assert.deepEqual(averages[cohort].values, cohortAverage, 'CSV Average - Cohort ' + cohort + ' has incorrect # of participants');

        const cohortDeviation = compute.computeDeviation(inputs[cohort]);
        assert.equal(deviations[cohort].count, inputs[cohort].length, 'CSV Deviation - Cohort ' + cohort + ' has incorrect # of participants');
        assert.deepEqual(deviations[cohort].values, cohortDeviation, 'CSV Deviation - Cohort ' + cohort + ' has incorrect # of participants');
      }
    });
  });
});

