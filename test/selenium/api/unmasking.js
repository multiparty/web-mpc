/* eslint-env node, mocha */
const { By, until, Condition } = require('selenium-webdriver');
const assert = require('assert');

const helpers = require('../helpers.js');

module.exports = {};
module.exports.unmask = async function (driver, sessionKey, password) {
  const pemFilePath = helpers.getUserHome() + '/Downloads/Session_' + sessionKey + '_private_key.pem';

  await driver.get('localhost:8080/unmask');

  // Enter sessionKey and password
  var sessionField = driver.findElement(By.id('session'));
  var passwordField = driver.findElement(By.id('session-password'));

  await sessionField.sendKeys(sessionKey);
  await passwordField.sendKeys(password);

  // Upload PEM File to start decryption
  const fileUpload = await driver.findElement(By.id('choose-file'));
  fileUpload.sendKeys(pemFilePath);

  // Wait until done
  const countCondition = new Condition('Ensure table elements count is 640', async function () {
    var elements = await driver.findElements(By.xpath('//td[@class="htDimmed"]'));
    if (elements.length === 640) {
      return elements;
    }
    if (elements.length > 0) {
      // Work around, force hands on table to resize, so that all tds are visible
      // TODO: should ignore the table and test based on downloaded files
      // When fixing TODO remove global variable window.handsontables defined in tableController.displayReadTable
      await driver.executeScript('window.handsontables.forEach(hot => hot.updateSettings({width: 2000}));');
    }
    return false;
  });

  const cells = await helpers.conditionOrAlertError(driver, countCondition);

  // return results as a 1D array
  console.time('Unmasking Checks');
  for (var i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (i % (16 * 5) === 0 || i === cells.length-1) {
      // hack: force handsontable to render td to render by clicking on it
      // to speed this up, only click two elements per table (and the last element for good measure)
      await cell.click();
    }

    const value = await cell.getText(); // must do this synchronously to avoid hot rendering tricks
    assert.equal(value.toString(), '1.00', 'Output values in table are wrong');
  }
  console.timeEnd('Unmasking Checks');
};
