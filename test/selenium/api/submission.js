/* eslint-env node, mocha */
const { By, until } = require('selenium-webdriver');
const helpers = require('../helpers.js');

async function uploadFile(driver, uploadFilePath) {
  // Upload File
  const uploadFileField = await driver.findElement(By.id('choose-file'));
  await uploadFileField.sendKeys(process.cwd() + uploadFilePath);

  // Close alertify dialog showing successful file parsing
  const alertifyOk = await driver.wait(until.elementLocated(By.className('ajs-ok')));
  await driver.wait(until.elementIsEnabled(alertifyOk));
  await alertifyOk.click();

  const alertifyModal = await driver.findElement(By.className('ajs-modal'));
  await driver.wait(until.elementIsNotVisible(alertifyModal));

  return await helpers.readTableDataAsArray(driver);
}

async function enterRandomData(driver, maxElement=undefined) {
  // open tables area
  const expandToggle = await driver.findElement(By.id('expand-table-button'));
  await expandToggle.click();

  // get the tables
  var formattedData = [];
  var tableCount = await driver.executeScript('return window.__tables.length;');
  for (var table = 0; table < tableCount; table++) {
    var rowCount = await driver.executeScript('return window.__tables[' + table + '].countRows();');
    var colCount = await driver.executeScript('return window.__tables[' + table + '].countCols();');

    var data = helpers.generateRandomData(rowCount, colCount, maxElement);
    var strData = JSON.stringify(data);

    await driver.executeScript('window.__tables[' + table + '].updateSettings({data: JSON.parse(\'' + strData + '\')});');
    formattedData = formattedData.concat(data.reduce((v1, v2) => v1.concat(v2)));
  }

  return formattedData
}

module.exports = {
  submitCohortSelf: async function (driver, link, cohort, uploadFilePath=undefined, maxElement=undefined) {
    driver.get(link);

    const participationCodeSuccessField = await driver.findElement(By.id('participation-code-success'));
    const cohortSelectField = await driver.findElement(By.id('cohortDrop'));

    // Wait for page to load
    await helpers.conditionOrAlertError(driver, until.elementIsVisible(participationCodeSuccessField));
    await helpers.conditionOrAlertError(driver, until.elementIsVisible(cohortSelectField));

    // Select Cohort
    await cohortSelectField.click();
    await cohortSelectField.findElement(By.css("option[value='" + cohort + "']")).click();

    var data;
    if (uploadFilePath != null) {
      // Test by parsing spreadsheet
      data = await uploadFile(driver, uploadFilePath);
    } else {
      // Test manual entry
      data = await enterRandomData(driver, maxElement);
    }

    // Verify data
    const verifyButton = await driver.findElement(By.id('verify'));
    await driver.wait(until.elementIsEnabled(verifyButton));
    await verifyButton.click();

    // Submit data
    const submitButton = await driver.findElement(By.id('submit'));
    await driver.wait(until.elementIsEnabled(submitButton));
    await submitButton.click();

    // Verify success
    const successDialog = await helpers.conditionOrAlertError(driver, until.elementLocated(By.id('submission-success')));
    await driver.wait(until.elementIsVisible(successDialog));

    // Close alertify dialog
    const alertifyOk = await driver.wait(until.elementLocated(By.className('ajs-ok')));
    const alertifyModal = await driver.findElement(By.className('ajs-modal'));

    await driver.wait(until.elementIsEnabled(alertifyOk));
    await alertifyOk.click();

    await driver.wait(until.elementIsNotVisible(alertifyModal));

    // return uploaded data
    return data;
  }
};
