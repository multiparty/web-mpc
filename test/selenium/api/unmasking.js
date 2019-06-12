/* eslint-env node, mocha */
const { By, Condition } = require('selenium-webdriver');
const readline = require('readline');
const fs = require('fs');

const helpers = require('../helpers.js');

module.exports = {};
module.exports.unmask = async function (driver, sessionKey, password, outputCount) {
  const downloadsPath = helpers.getUserHome() + '/Downloads/';
  const pemFilePath = downloadsPath + 'Session_' + sessionKey + '_private_key.pem';

  await driver.get('localhost:8080/unmask');

  // Enter sessionKey and password
  var sessionField = driver.findElement(By.id('session'));
  var passwordField = driver.findElement(By.id('session-password'));

  await sessionField.sendKeys(sessionKey);
  await passwordField.sendKeys(password);

  // Upload PEM File to start decryption
  const fileUpload = await driver.findElement(By.id('choose-file'));
  await fileUpload.sendKeys(pemFilePath);

  // Wait until done (detect done by the tables expanding)
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

  // Sleep to ensure files were downloaded
  await driver.sleep(5000);

  // Read data from UI / Tables
  const tablesContent = await helpers.readTableDataAsArray(driver);

  // Read data from CSV
  const averageFile = downloadsPath + 'Aggregate_Averages_' + sessionKey + '.csv';
  const deviationFile = downloadsPath + 'Aggregate_Standard_Deviations_' + sessionKey + '.csv';

  const averagesContent = fs.readFileSync(averageFile, 'utf8');
  const deviationsContent = fs.readFileSync(deviationFile, 'utf8');
  return { tablesContent, averagesContent, deviationsContent };
};
