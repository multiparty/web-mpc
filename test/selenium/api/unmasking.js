/* eslint-env node, mocha */
const { By, Condition } = require('selenium-webdriver');

const helpers = require('../helpers.js');

module.exports = {};
module.exports.unmask = async function (driver, sessionKey, password, outputCount) {
  const pemFilePath = helpers.getUserHome() + '/Downloads/Session_' + sessionKey + '_private_key.pem';

  await driver.get('localhost:8080/unmask');

  // Enter sessionKey and password
  var sessionField = driver.findElement(By.id('session'));
  var passwordField = driver.findElement(By.id('session-password'));

  await sessionField.sendKeys(sessionKey);
  await passwordField.sendKeys(password);

  // Upload PEM File to start decryption
  const fileUpload = await driver.findElement(By.id('choose-file'));
  await fileUpload.sendKeys(pemFilePath);

  // Wait until done
  const countCondition = new Condition('Ensure table elements count is 640', async function () {
    var elements = await driver.findElements(By.xpath('//td[@class="htDimmed"]'));
    if (elements.length === outputCount) {
      return elements;
    }
    if (elements.length > 0) {
      // Work around, force hands on table to resize, so that all tds are visible
      await driver.executeScript('window.__tables.forEach(hot => hot.updateSettings({width: 2000}));');
    }
    return false;
  });

  await helpers.conditionOrAlertError(driver, countCondition);
  return await helpers.readTableDataAsArray(driver);
};
