const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const helpers = require('../helpers/helpers.js');
const fs = require('fs');

const UNASSIGNED_COHORT = '0';

module.exports = {};

module.exports.login = async function (driver, sessionKey, password) {
  await driver.get('http://localhost:8080/manage');

  const sessionField = await driver.findElement(By.id('session'));
  const passwordField = await driver.findElement(By.id('password'));
  const loginButton = await driver.findElement(By.id('login'));

  // Wait for session and password fields to exist
  await driver.sleep(1000);

  await sessionField.sendKeys(sessionKey);
  await passwordField.sendKeys(password);
  loginButton.click();

  const sessionStatusText = await driver.findElement(By.id('session-status'));
  await helpers.conditionOrAlertError(driver, until.elementTextMatches(sessionStatusText, /^(STARTED)|(PAUSED)|(STOPPED)$/));
};

module.exports.downloadLinks = async function(driver, cohort, count) {
  const downloadBtn = await driver.findElement(By.id('participants-download-' + cohort));
  downloadBtn.click();

  if (count === 0) {
      // Close alertify dialog showing error
    const alertifyError = await driver.wait(until.elementLocated(By.className('ajs-ok')));
    await driver.wait(until.elementIsEnabled(alertifyError));
    await driver.wait(until.elementIsVisible(alertifyError));
    await alertifyError.click();
    return;
  }

  // Sleep to ensure files were downloaded
  await driver.sleep(5000);
  const downloadsPath = helpers.getUserHome() + '/Downloads/' + 'Participant_Links_' + count + '.csv';
  content = fs.readFileSync(downloadsPath, 'utf8');
  assert.equal(content.split('\n').length, count);
};

module.exports.createCohorts = async function (driver, cohort_count) {
  const numCohortsField = await driver.findElement(By.id('cohort-number'));
  const addCohortsButton = await driver.findElement(By.id('cohort-generate'));

  await driver.wait(until.elementIsVisible(addCohortsButton));

  await numCohortsField.sendKeys(cohort_count.toString());
  addCohortsButton.click();
  await driver.sleep(1000);
};

module.exports.generateLinksByCohort = async function (driver, count, num_cohorts) {
  let links = {};
  let count_per_cohort = count / num_cohorts;
  for (let i = 0; i < num_cohorts; i++) {
    links[i] = await this.generateLinksOneCohort(driver, count_per_cohort, i);
  }

  return links;
};

module.exports.generateLinksOneCohort = async function (driver, cohort_count, cohort) {
  const linksCountField = await driver.findElement(By.id('participants-count-' + cohort));
  const submitButton = await driver.findElement(By.id('participants-submit-' + cohort));
  const linksArea = await driver.findElement(By.id('participants-new-' + cohort));

  await driver.wait(until.elementIsVisible(submitButton));
  await driver.wait(until.elementIsEnabled(submitButton));

  await linksCountField.sendKeys(cohort_count.toString());
  submitButton.click();

  await helpers.conditionOrAlertError(driver, until.elementIsVisible(linksArea));

  var links = await linksArea.getText();
  links = links.trim().split('\n').map(link => link.trim());

  assert.equal(links.length, cohort_count, 'Incorrect participation links count');

  return links;
};

module.exports.getExistingLinksByCohorts = async function (driver, num_cohorts) {
  let links = {};
  for (let i = 0; i < num_cohorts; i++) {
    const existingLinksField = await driver.findElement(By.id('participants-existing-' + i));
    await driver.wait(until.elementIsVisible(existingLinksField));
    var links_i = await existingLinksField.getText();
    links_i = links_i.trim().split('\n').map(link => link.trim());
    links[i] = links_i;
  }
  return links;
};

module.exports.getHistory = async function (driver, cohortCount) {
  const history = {};
  for (let cohort = 0; cohort < cohortCount; cohort++) {
    const cohortHistory = await driver.findElements(By.xpath('// *[@id="table-' + cohort + '"]/tbody/tr'));
    history[cohort+1] = cohortHistory.length;
  }
  return history;
};

module.exports.changeSessionStatus = async function (driver, status) {
  var statusSuccess = status.toUpperCase() + 'ED';
  if (status === 'pause') {
    statusSuccess = status.toUpperCase() + 'D';
  } else if (status === 'stop') {
    statusSuccess = status.toUpperCase() + 'PED';
  }

  const sessionStatusField = await driver.findElement(By.id('session-status'));
  const sessionControlButton = await driver.findElement(By.id('session-'+status));
  await driver.wait(until.elementIsVisible(sessionControlButton));
  await driver.wait(until.elementIsEnabled(sessionControlButton));

  var click = sessionControlButton.click(); // TODO: Could cause issue and hang? Double check

  if (status === 'stop') {
    await click;
    const confirmButton = await driver.findElement(By.id('session-close-confirm'));
    await driver.wait(until.elementIsVisible(confirmButton));
    await driver.wait(until.elementIsEnabled(confirmButton));
    confirmButton.click();
  }

  await helpers.conditionOrAlertError(driver, until.elementTextIs(sessionStatusField, statusSuccess));
};
