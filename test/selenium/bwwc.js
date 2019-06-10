/* eslint-env node, mocha */
const driverWrapper = require('./driver.js');

// import test API
const session = require('./api/session.js');
const manage = require('./api/manage.js');
const submission = require('./api/submission.js');
const unmasking = require('./api/unmasking.js');

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
    var driver = driverWrapper.getDriver();

    // Create session
    var { sessionKey, password } = await session.createSession(driver);

    // Session Management
    await manage.login(driver, sessionKey, password);
    var links = await manage.generateLinksNoCohorts(driver, 10);
    await manage.changeSessionStatus(driver, 'start');

    // Submit
    console.time('Total Submission');
    for (var i = 0; i < links.length; i++) {
      console.time('Submission ' + i);
      await submission.submitCohortSelf(driver, links[i], i % 7);
      console.timeEnd('Submission ' + i);
    }
    console.timeEnd('Total Submission');

    // Unmask
    await manage.login(driver, sessionKey, password);
    await manage.changeSessionStatus(driver, 'stop');

    console.time('Unmasking');
    await unmasking.unmask(driver, sessionKey, password);
    console.timeEnd('Unmasking');
  });
});
