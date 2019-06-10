/* eslint-env node, mocha */
const { By, until } = require('selenium-webdriver');

const helpers = require('../helpers.js');
const uploadFile = '/test/selenium/files/bwwc.xlsx';

module.exports = {
  submitCohortSelf: async function (driver, link, cohort) {
    driver.get(link);

    const participationCodeSuccessField = await driver.findElement(By.id('participation-code-success'));
    const cohortSelectField = await driver.findElement(By.id('cohortDrop'));

    // Wait for page to load
    await helpers.conditionOrAlertError(driver, until.elementIsVisible(participationCodeSuccessField));
    await helpers.conditionOrAlertError(driver, until.elementIsVisible(cohortSelectField));

    // Select Cohort
    await cohortSelectField.click();
    await cohortSelectField.findElement(By.css("option[value='" + cohort + "']")).click();

    // Upload File
    const fileUpload = await driver.findElement(By.id('choose-file'));
    await fileUpload.sendKeys(process.cwd() + uploadFile);

    // Close alertify dialog showing successful file parsing
    var alertifyOk = await driver.wait(until.elementLocated(By.className('ajs-ok')));
    await driver.wait(until.elementIsEnabled(alertifyOk));
    await alertifyOk.click();

    const alertifyModal = await driver.findElement(By.className('ajs-modal'));
    await driver.wait(until.elementIsNotVisible(alertifyModal));

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

    alertifyOk = await driver.wait(until.elementLocated(By.className('ajs-ok')));
    await driver.wait(until.elementIsEnabled(alertifyOk));
    await alertifyOk.click();

    await driver.wait(until.elementIsNotVisible(alertifyModal));
  }
};
