/* eslint-env node, mocha */
const { By, until, Key } = require('selenium-webdriver');
const helpers = require('../helpers/helpers.js');

async function uploadFile(driver, uploadFilePath) {
  // Upload File
  const uploadFileField = await driver.findElement(By.id('choose-file'));
  await uploadFileField.sendKeys(process.cwd() + uploadFilePath);

  // Close alertify dialog showing successful file parsing
  const alertifyOk = await driver.wait(until.elementLocated(By.className('ajs-ok')));
  await driver.wait(until.elementIsEnabled(alertifyOk));
  await driver.wait(until.elementIsVisible(alertifyOk));
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
  submitInput: async function (driver, link, cohort, selfSelect, uploadFilePath=undefined, resubmit=false, maxElement=undefined) {
    await driver.get(link);

    const participationCodeSuccessField = await driver.findElement(By.id('participation-code-success'));
    await helpers.conditionOrAlertError(driver, until.elementIsVisible(participationCodeSuccessField));

    if (selfSelect) {
      // Select Cohort
      const cohortSelectField = await driver.findElement(By.id('cohortDrop'));
      await helpers.conditionOrAlertError(driver, until.elementIsVisible(cohortSelectField));

      await cohortSelectField.click();
      await cohortSelectField.findElement(By.css("option[value='" + cohort + "']")).click();
    }

    var data;
    if (uploadFilePath != null) {
      // Test by parsing spreadsheet
      data = await uploadFile(driver, uploadFilePath);
    } else {
      // Test manual entry
      data = await enterRandomData(driver, maxElement);
    }

    // Verify & Submit data
    const verifyButton = await driver.findElement(By.id('verify'));
    const submitButton = await driver.findElement(By.id('submit'));
    await driver.wait(until.elementIsEnabled(verifyButton));

    do { // may need to verify a few times if tables have not fully populated properly at times.
      try {
        await verifyButton.click();
      } catch (error) {
        // handles common errors if tests are run locally, and the mouse is moved
        console.log(error);
      }
    } while (! await verifyButton.isSelected());
    await driver.sleep(1000)
    await driver.wait(until.elementIsEnabled(submitButton));
    await driver.sleep(5000); // Sometimes submission doesn't trigger if button clicked too early 
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

    if (resubmit) {
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
    }

    // return uploaded data
    return data;
  }
};
