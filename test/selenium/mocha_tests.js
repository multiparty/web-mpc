const assert = require('assert');
{ describe , before , after , it }  require('selenium-webdriver/testing');
const webdriver = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');
const expect = require('chai').expect;
let chrome = require('selenium-webdriver/chrome');
let path = require('chromedriver').path;

let sessionKey = null;
let sessionPassword = null;
const numberOfParticipants = 2;
// const cohortNumber = 1;
const participant_codes = [];
const participant_links = [];

function createDriver() {
  var service = new chrome.ServiceBuilder(path).build();
    chrome.setDefaultService(service);
  var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

  return driver;

}

describe('End-to-end workflow test', function() {
  var driver; 
  before(function() {
    driver = createDriver();
  });

  after(function() {
    driver.quit();
  });

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
          console.log('key', sessionKey);
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
          console.log('sessionPs', sessionPassword);
          expect(text.length).to.equal(26);
        }));
  });    

  it ('Get participant links', async() => {
    await driver.wait(function() {
      return driver.findElement(By.id('link-id')).isDisplayed();
    }, 20000);
    // click link to manage page
    await driver.findElement(By.id('link-id'))
      .then((manageLink) => manageLink.click());

    // wait for fields to appear, then enter session password (SessionKey should be filled already)
    await driver.wait(function() {
      return driver.findElement(By.id('password')).isDisplayed();
    }, 2000);

    await driver.findElement(By.id('password'))
      .then((description) => description.sendKeys(sessionPassword) )
      //click submit button
      .then(() => driver.findElement(By.id('login')).click() );

    await driver.sleep(200);
    await driver.wait(function() {
      return driver.findElement(By.id('session-start')).isDisplayed();
    }, 20000);
    //start session
    await driver.findElement(By.id('session-start'))
      .then((startButton) => startButton.click() );

    await driver.sleep(100);
    //add participants
    await driver.wait(function () {
      return driver.findElement(By.id('participants-submit')).isDisplayed();
    }, 20000);
    await driver.findElement(By.id('participants-count'))
      .then((description) => description.sendKeys(numberOfParticipants.toString()) )
      .then(() => driver.findElement(By.id('participants-submit')).click() );

    await driver.wait(function () {
      return driver.findElement(By.id('participants-new')).isDisplayed();
    }, 10000);
    await driver.findElement(By.id('participants-new'))
      .then((participants) => participants.getText().then(function (text) {
        var participants = text.trim().split('\n');
        for (var i = 0; i < participants.length; i++) {
          participants[i] = participants[i].trim();
          participant_links.push(participants[i]);

          if (participants[i] !== '') {
            var index = participants[i].indexOf('participationCode') + 'participationCode'.length + 1;
            participant_codes.push(participants[i].substring(index));
          }
        }
        expect(participant_links.length).to.equal(numberOfParticipants);
        console.log('Number of participants: ', participant_links.length, ',' , numberOfParticipants);
      }) );
  });
});