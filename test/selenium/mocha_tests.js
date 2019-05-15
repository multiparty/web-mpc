const assert = require('assert');
const webdriver = require('selenium-webdriver');
const { By } = require('selenium-webdriver');
const expect = require('chai').expect;
let chrome = require('selenium-webdriver/chrome');
let path = require('chromedriver').path;


let sessionKey = null;
let sessionPassword = null;

const numberOfParticipants = 2;
// const cohortNumber = 1;
const dataValue = 2;

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
    await createSession(driver);
  });    

  it ('Get participant links', async() => {
    await generateParticipantLinks(driver);
  });

  it('Data submission', async() => {
    var originalTab = driver.getWindowHandle();
    await dataSubmission(driver, originalTab);
  });

  it('Close and unmask session', async() => {
    var tabs = await driver.getAllWindowHandles();
    await closeSession(driver, tabs[0]);
    await unmaskData(driver);
  });

  // - - - - - - - 
  // H E L P E R S
  // - - - - - - -
  function handleFailure(err, driver) {
    // driver.takeScreenshot();
    assert.fail('Error: ' + err)
    driver.quit();
  }
  
  function getUserHome() {
    return process.env.HOME || process.env.USERPROFILE;
  }

  async function createSession(driver) {
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
  }


  async function generateParticipantLinks(driver) {
    try {
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
          console.log('Number of links: ', participant_links.length);
          console.log(participant_links);
        }) );
      } catch (e) {
      handleFailure(e, driver)
    }
  }

  async function closeSession(driver, originalTab) {
    try {
      //switch back to manage page
      await driver.switchTo().window(originalTab);
      driver.sleep(20000);
      // stop session
      var stopButton = await driver.findElement(By.id('session-stop'));
      stopButton.click();
      // press okay
      await driver.sleep(500);
      var confirmButton = await driver.findElement(By.id('session-close-confirm'));
      confirmButton.click();  

      const rows = await driver.findElements(By.id('history-row')); 
      // expect(rows.length).to.equal(numberOfParticipants);
      console.log('Number of submissions: ', rows.length);


      // unmask
      await driver.sleep(500);
      // click link to unmask page
      await driver.findElement(By.xpath('//a[.="here"]'))
        .then((manageLink) => manageLink.click());
    } catch (err) {
      handleFailure(err, driver);
    }
  }

  async function unmaskData(driver) {
    try {
      await driver.sleep(500);
      driver.findElement(By.id('session'))
        .then((key) =>  key.sendKeys(sessionKey) )
        .then(() => driver.findElement(By.id('session-password')) )
        .then((password) => password.sendKeys(sessionPassword) )
      await driver.sleep(500);
      var fileUpload = await driver.findElement(By.id('choose-file'));
      var filePath = getUserHome() + '/Downloads/' + 'Session_' + sessionKey + '_private_key.pem'
      fileUpload.sendKeys(filePath);
  
  
      var tableValues;
      await driver.wait(async function () {
        tableValues = await driver.findElements(By.xpath('//td[@class="htDimmed"]'));
        return (tableValues.length > 0);
      }, 5000);
  
      // check values
      for (var i = 0; i < tableValues.length; i++) {
        var value = await tableValues[i].getText();
        if (!isNaN(parseInt(value))) {
          expect(parseInt(value)).to.equal(dataValue * numberOfParticipants);
        }
      }
    } catch (err) {
      handleFailure(err, driver);
    }
  }

  async function dataSubmission(driver, originalTab) {
    try {
      await driver.wait(function () {
        return participant_links.length > 0;
      }, 20000);
      driver.executeScript('window.open();');
      //Wait for the new window or tab
      await driver.wait(function() {
        return driver.getAllWindowHandles().then(function(windows) {
          return windows.length === 2;
        });
      }, 10000);
      var windows = (await driver.getAllWindowHandles());
      for (var i = 0; i < windows.length; i++) {
        if(windows[i]!==originalTab) {
          await driver.switchTo().window(windows[i]);
        }
      }
  
      for (var i = 0; i < participant_links.length; i++){
        await driver.get(participant_links[i])
          .then(async function () {
            //wait to have the session id / code verified
            await driver.wait(function() {
              return driver.findElement(By.id('session-success')).isDisplayed();
            }, 10000);
  
            var fileUpload = await driver.findElement(By.id('choose-file'));
            var filePath = process.cwd() + '/test/selenium/files/bwwc.xlsx';
            fileUpload.sendKeys(filePath);

  
            //wait for upload success
            await driver.wait(async function() {
              var ok = await driver.findElements(By.className('ajs-ok'));
              if (ok.length > 0) {
                ok[0].click();
                return true;
              } else {
                return false;
              }
            }, 5000);
  
            await driver.sleep(1000); // must await the sleep
            await driver.wait(async function() {
              //find all
              var surveyOpts = await driver.findElements(By.xpath('//input[@name="optradio" and @value="1"]'));
              if (surveyOpts[0].isSelected()) {
                for (var k = 0; k < surveyOpts.length; k++) {
                  surveyOpts[k].click();
                }
                return true;
              } else {
                return false;
              }
            }, 5000);
  
            var verifyBox = await driver.findElement(By.id('verify'));
            verifyBox.click();
            await driver.sleep(500);
            await driver.wait(async function () {
              var button = await driver.findElement(By.id('submit'));
              if (button.isEnabled()) {
                button.click();
                await driver.sleep(100);
                button.click();
                return true;
              } else {
                return false;
              }
            }, 5000);
  
            //TODO wait until submission confirmation popup
            await driver.sleep(5000);
            var success = await driver.findElements(By.id('submission-success-btn'));
            expect(success).to.exist;
          });
      }
    } catch (err) {
      handleFailure(err, driver);
    }
  }
});