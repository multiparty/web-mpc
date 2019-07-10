/* eslint-env node, mocha */
const { By, until } = require('selenium-webdriver');
const assert = require('assert');

const helpers = require('../helpers/helpers.js');

module.exports = {};

module.exports.createEmptySession = async function (driver) {
  await driver.get('localhost:8080/create');

  const generateButton = await driver.findElement(By.id('generate'));
  generateButton.click();

  const alertifyError = await driver.wait(until.elementLocated(By.className('ajs-ok')));
  await driver.wait(until.elementIsEnabled(alertifyError));
  await driver.wait(until.elementIsVisible(alertifyError));
  await alertifyError.click();
}

// create session
module.exports.createSession = async function (driver, title='test session', description='testing') {
  await driver.get('localhost:8080/create');

  const titleField = await driver.findElement(By.id('session-title'));
  const descField = await driver.findElement(By.id('session-description'));
  const generateButton = await driver.findElement(By.id('generate'));

  const sessionField = await driver.findElement(By.id('sessionID'));
  const passwordField = await driver.findElement(By.id('passwordID'));

  // create session
  await titleField.sendKeys(title);
  await descField.sendKeys(description);
  generateButton.click();

  // read session information
  await helpers.conditionOrAlertError(driver, until.elementIsVisible(sessionField));
  await driver.wait(until.elementIsVisible(passwordField));

  const sessionText = await sessionField.getText();
  const passwordText = await passwordField.getText();

  assert.equal(sessionText.length, 26, 'Session Key has incorrect length');
  assert.equal(passwordText.length, 26, 'Password has incorrect length');
  return { sessionKey: sessionText, password: passwordText };
};
