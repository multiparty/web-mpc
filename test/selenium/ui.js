/* eslint-env node, mocha */
const assert = require('assert');

// Helpers
const driverWrapper = require('./helpers/driver.js');

// import test API
const server = require('./helpers/server.js');
const session = require('./api/session.js');
const manage = require('./api/manage.js');

describe('UI Test', function () {
  let driver;
  this.timeout(15000);
  const CONTRIBUTOR_COUNT = 100;
  const UNASSIGNED_COHORT = '0';

  // Create the chrome driver before tests and close it after tests
  before(async function () {
    server.create("single_cell");
    driverWrapper.create();
    driver = driverWrapper.getDriver();
    await driver.sleep(10000);
  });
  after(async function () {
    driverWrapper.quit();
    server.quit();
    await driver.sleep(1000);
  });

  // Test that creating a session with empty title/description gives errors
  describe('/create', function () {
    it('Empty session information', async function() {
      await session.createEmptySession(driver);
    });
  });

  // Test that we can download participation links properly
  describe('/manage', function () {
    it('Download links', async function() {
      let returned = await session.createSession(driver);
      const sessionKey = returned.sessionKey;
      const password = returned.password;
      await manage.login(driver, sessionKey, password); // Login to Session Management
      // Ensure UI transition has finished
      await driver.sleep(500);
      await manage.downloadLinks(driver, UNASSIGNED_COHORT, 0);
      await driver.sleep(500);
      await manage.generateLinksNoCohorts(driver, CONTRIBUTOR_COUNT);
      await driver.sleep(500);
      await manage.downloadLinks(driver, UNASSIGNED_COHORT, CONTRIBUTOR_COUNT);
    });
  });
});
