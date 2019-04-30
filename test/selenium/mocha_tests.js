const assert = require('assert');
// const test = require('selenium-webdriver/testing');
const webdriver = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');
const expect = require('chai').expect;

let sessionKey = null;
let sessionPassword = null;

var driver = new webdriver.Builder()
.withCapabilities(webdriver.Capabilities.chrome())
.build();


describe('End-to-end workflow test', function() {

  it('Create session', async () => {

    await driver.get('localhost:8080/create')
      .then(() => driver.findElement(By.id('session-title')))
      .then((title) =>  title.sendKeys('test-session'))
      .then(() => driver.findElement(By.id('session-description')))
      .then((description) => description.sendKeys('test-session description'))
      .then(() => driver.findElement(By.id('generate')).click());

    // Get session key
    await driver.wait(function() {
      return driver.findElement(By.id('sessionID')).isDisplayed();
    }, 10000);
    await driver.findElement(By.id('sessionID'))
      .then(elem => elem.getText()
        .then(function (text) {
          sessionKey = text;
          expect(text.length).to.equal(26);
        }));

    // Get session password
    await driver.wait(function() {
      return driver.findElement(By.id('passwordID')).isDisplayed();
    }, 10000);
    //save sessionPassword
    await driver.findElement(By.id('passwordID'))
      .then(elem => elem.getText()
        .then(function (text) {
          sessionPassword = text;
          expect(text.length).to.equal(26);
        }));
  });    
  after(async () => driver.quit());
});