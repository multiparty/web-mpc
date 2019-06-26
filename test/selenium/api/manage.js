const { By, until } = require('selenium-webdriver');
const assert = require('assert');
const helpers = require('../helpers.js');

const UNASSIGNED_COHORT = '0';

module.exports = {};

module.exports.login = async function (driver, sessionKey, password) {
  await driver.get('localhost:8080/manage');

  const sessionField = await driver.findElement(By.id('session'));
  const passwordField = await driver.findElement(By.id('password'));
  const loginButton = await driver.findElement(By.id('login'));

  await sessionField.sendKeys(sessionKey);
  await passwordField.sendKeys(password);
  loginButton.click();

  const sessionStatusText = await driver.findElement(By.id('session-status'));
  await helpers.conditionOrAlertError(driver, until.elementTextMatches(sessionStatusText, /^(STARTED)|(PAUSED)|(STOPPED)$/));
};

// module.exports.downloadLinks = async function(driver, cohort, count) {
//   const downloadBtn = await driver.findElement(By.id('participants-download-' + cohort));
//   downloadBtn.click();

//   if (count === 0) {
//       // Close alertify dialog showing error
//     const alertifyError = await driver.wait(until.elementLocated(By.className('ajs-ok')));
//     await driver.wait(until.elementIsEnabled(alertifyError));
//     await driver.wait(until.elementIsVisible(alertifyError));
//     await alertifyError.click();
//     return;
//   }

//   const downloadsPath = helpers.getUserHome() + '/Downloads/' + 'Participant_Links.csv';
//   content = fs.readFileSync(downloadsPath, 'utf8');
//   assert.equal(content.split(',').length, count);
// };

module.exports.generateLinksNoCohorts = async function (driver, count) {
  const linksCountField = await driver.findElement(By.id('participants-count-' + UNASSIGNED_COHORT));
  const submitButton = await driver.findElement(By.id('participants-submit-' + UNASSIGNED_COHORT));
  const linksArea = await driver.findElement(By.id('participants-new-' + UNASSIGNED_COHORT));

  await driver.wait(until.elementIsVisible(submitButton));
  await driver.wait(until.elementIsEnabled(submitButton));

  await linksCountField.sendKeys(count.toString());
  submitButton.click();

  await helpers.conditionOrAlertError(driver, until.elementIsVisible(linksArea));

  var links = await linksArea.getText();
  links = links.trim().split('\n').map(link => link.trim());

  assert.equal(links.length, count, 'Incorrect participation links count');

  return links;
};

module.exports.getExistingLinksNoCohorts = async function (driver) {
  const existingLinksField = await driver.findElement(By.id('participants-existing-' + UNASSIGNED_COHORT));
  await driver.wait(until.elementIsVisible(existingLinksField));

  var links = await existingLinksField.getText();
  links = links.trim().split('\n').map(link => link.trim());

  return links;
};

module.exports.getHistory = async function (driver, cohortCount) {
  const history = {};
  for (let cohort = 1; cohort <= cohortCount; cohort++) {
    const cohortHistory = await driver.findElements(By.xpath('// *[@id="table-' + cohort + '"]/tbody/tr'));
    history[cohort] = cohortHistory.length;
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
