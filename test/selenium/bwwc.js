/* eslint-env node, mocha */
const assert = require('assert');

// Helpers
const driverWrapper = require('./driver.js');
const compute = require('./compute.js');

// import test API
const session = require('./api/session.js');
const manage = require('./api/manage.js');
const submission = require('./api/submission.js');
const unmasking = require('./api/unmasking.js');

const UPLOAD_FILE = '/test/selenium/files/bwwc.xlsx';
const COHORT_COUNT = 7;
const CONTRIBUTOR_COUNT = 10;

describe('BWWC Tests', function () {
  // Create the chrome driver before tests and close it after tests
  before(function () {
    driverWrapper.create();
  });
  after(function () {
    driverWrapper.quit();
  });

  // End-to-end Workflow
  it('End-to-end with one cohort', async function () {
    const driver = driverWrapper.getDriver();

    // Create session
    const { sessionKey, password } = await session.createSession(driver);

    // Session Management
    await manage.login(driver, sessionKey, password);
    const links = await manage.generateLinksNoCohorts(driver, CONTRIBUTOR_COUNT);
    await manage.changeSessionStatus(driver, 'start');

    // Submit
    console.time('Total Submission');
    const inputs = { all: [] };
    for (var i = 0; i < links.length; i++) {
      const cohort = i % COHORT_COUNT;
      const uploadFile = i % 3 === 0 ? UPLOAD_FILE : undefined;

      console.time('Submission ' + i);
      const input = await submission.submitCohortSelf(driver, links[i], cohort, uploadFile);
      console.timeEnd('Submission ' + i);

      // Add input to inputs
      const cohortInputs = inputs[cohort] || [];
      cohortInputs.push(input);
      inputs[cohort] = cohortInputs;
      inputs['all'].push(input);
    }
    console.timeEnd('Total Submission');

    // Stop session
    await manage.login(driver, sessionKey, password);
    await manage.changeSessionStatus(driver, 'stop');

    // Sleep to give server time to finish processing
    console.log('Waiting 20 seconds');
    await driver.sleep(20000);
    console.log('done');

    // Unmask
    console.time('Unmasking');
    const output = await unmasking.unmask(driver, sessionKey, password, inputs['all'][0].length);
    console.timeEnd('Unmasking');

    // Perform average in the clear on inputs and verify result
    const average = compute.computeAverage(inputs['all']);

    // Check all outputs are equal
    assert.deepEqual(output, average, 'Average over all cohorts is incorrect');
  });
});
