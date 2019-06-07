const assert = require('assert');
const webdriver = require('selenium-webdriver');
const { By } = require('selenium-webdriver');
const expect = require('chai').expect;
const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;

let sessionKey = null;
let sessionPassword = null;
let numberOfParticipants = 2;
let dataValue = 1;
let numberOfCohorts = 1;

// TIMEOUT CONSTANTS
const shortTimeout = 5000;
const medTimeout = 20000;
const longTimeout = 200000;
const unmaskingTimeout = 900000;

// ERRORS
const SHEET_ERROR = 'This format is not supported.'

function createDriver() {
  var service = new chrome.ServiceBuilder(path).build();
    chrome.setDefaultService(service);
  var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

  return driver;
}


describe('Workflow tests', function() {
  var driver; 
  before(function() {
    driver = createDriver();
  });

  after(function() {
    driver.quit();
  });

  it('Basic end to end test with one cohort', async () => {
    await createSession(driver);
    var participantLinks = await generateParticipantLinks(driver, 'null');
    await dataSubmission(driver, participantLinks, '/test/selenium/files/bwwc.xlsx', true);
    await closeSession(driver);
    await unmaskData(driver);
  });    

  it('Basic end to end test with cohort self selection', async () => {
    numberOfCohorts = 6;
    numberOfParticipants = 5;
    await createSession(driver);
    var participantLinks = await generateParticipantLinks(driver, 'null');
    await dataSubmission(driver, participantLinks, '/test/selenium/files/bwwc.xlsx', true);
    await closeSession(driver);
    await unmaskData(driver);
  });    

  // it('Spreadsheet formatting', async () => {
  //   numberOfCohorts = 1;
  //   numberOfParticipants = 1;
  //   await createSession(driver);
  //   var participantLinks = await generateParticipantLinks(driver, 'null');
  //   console.log('received', participantLinks)
  //   await dataSubmission(driver, participantLinks, '/test/selenium/files/bwwc_missing_cell.xlsx', false);
  //   await dataSubmission(driver, participantLinks, '/test/selenium/files/pace.xlsx', false);
  // });
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
  try {
    // create session
    await driver.get('localhost:8080/create').then(async function() {
      await driver.wait(async function() {
        const title = driver.findElement(By.id('session-title'));
        const desc = driver.findElement(By.id('session-description'));

        if (title.isDisplayed() && desc.isDisplayed()) {
          title.sendKeys('test-session');
          desc.sendKeys('description');
          driver.findElement(By.id('generate')).click();
          return true;
        } 
        assert.fail('Failed to create a new session');
        return false;
      }, shortTimeout);

      // save session information
      await driver.wait(async function() {
        const sessionID = driver.findElement(By.id('sessionID'));
        const password = driver.findElement(By.id('passwordID'));

        if (sessionID.isDisplayed() && password.isDisplayed()) {
          await sessionID.getText().then(function(text) {
            sessionKey = text;
          });

          await password.getText().then(function(text) {
            sessionPassword = text;
          });

          if (sessionKey.length === 26 && sessionPassword.length === 26) {
          console.log('Session key: ' + sessionKey);
          console.log('Session pass: ' + sessionPassword);
          return true;
          }
        }
      }, shortTimeout);

      expect(sessionKey.length).to.equal(26);
      expect(sessionPassword.length).to.equal(26);

      await driver.wait(async function() {
        return driver.findElement(By.id('link-id')).isDisplayed();
      }, shortTimeout);
    });
  } catch (e) {
    handleFailure(e, driver);
  }
}

async function generateParticipantLinks(driver, cohort) {
  var participantLinks = [];

  try {
    await driver.get('localhost:8080/manage').then(async function () {
      // login
      await driver.wait(async function() {
        const key = driver.findElement(By.id('session'));
        const pw = driver.findElement(By.id('password'));
        if (key.isDisplayed() && pw.isDisplayed()) {
          key.sendKeys(sessionKey);
          pw.sendKeys(sessionPassword);
          await driver.findElement(By.id('login')).click();
          return true;
        }
        assert.fail('Failed to log into analyst page')
        return false;
      }, shortTimeout);

      await driver.wait(async function () {
        const sessionStart = await driver.findElement(By.id('session-start'));
        const enabled = await sessionStart.isEnabled();
        if (enabled) {
          await driver.sleep(500);
          sessionStart.click();
          return true;
        }
      }, longTimeout);
  
      await driver.wait(async function() {
        const submitLink = driver.findElement(By.id('participants-submit-' + cohort));
        const linkCount = driver.findElement(By.id('participants-count-' + cohort));
        if (submitLink.isDisplayed() && linkCount.isDisplayed()) {
          linkCount.sendKeys((numberOfParticipants * numberOfCohorts).toString());
          driver.findElement(By.id('participants-submit-' + cohort)).click();
          return true;
        }
      }, longTimeout);

      await driver.wait(function () {
        return driver.findElement(By.id('participants-new-' + cohort)).isDisplayed();
      }, longTimeout);

      await driver.findElement(By.id('participants-new-' + cohort))
      .then((participants) => participants.getText().then(function (text) {
        var participants = text.trim().split('\n');
        for (var i = 0; i < participants.length; i++) {
          participants[i] = participants[i].trim();
          participantLinks.push(participants[i]);
        }
        expect(participantLinks.length).to.equal(numberOfParticipants * numberOfCohorts);
        console.log('Number of links: ', participantLinks.length);
        console.log(participantLinks);
      }));

      await driver.wait(async function () {
        const status = await driver.findElement(By.id('session-status'));
        var text = ''

        if (status.isDisplayed()) {
          await status.getText().then(function(t) {
            text = t;
          });
        }

        if (text === 'STARTED') {
          console.log('status: ', text);
          return true;
        }
      }, medTimeout);
    });
  } catch (e) {
    handleFailure(e, driver);
  }
  return participantLinks;
}

async function dataSubmission(driver, participantLinks, uploadFile, succeed) {
  try {  
    for (var cohort = 0; cohort < numberOfCohorts; cohort++) {
      for (var i = 0; i < numberOfParticipants; i++){
        var participant = participantLinks.pop();
        await driver.get(participant)
          .then(async function () {
          await driver.wait(async function() {
            return await driver.findElement(By.id('participation-code-success')).isDisplayed();
          }, shortTimeout);

          await driver.wait(async function() {
            var cohorts = await driver.findElement(By.id('cohortDrop'))
            if (cohorts.isDisplayed()) {
              cohorts.click();
              cohorts.findElement(By.css("option[value='" + cohort + "']")).click();
              return true;
            }
            return false;
          }, shortTimeout);

          var fileUpload = await driver.findElement(By.id('choose-file'));
          var filePath = process.cwd() + uploadFile;
          fileUpload.sendKeys(filePath);
          driver.sleep(10000)

          // test fail condition
          if (!succeed) {
            await driver.wait(async function() {
              var popup = await driver.findElements(By.className('ajs-content'));
              if (popup.length > 0) {
                await popup[0].getText().then(function(t) {
                  expect(t).to.equal(SHEET_ERROR);
                });
                return true;
              }
            }, longTimeout);
            return;
          }

          //wait for upload success
          await driver.wait(async function() {
            var ok = await driver.findElements(By.className('ajs-ok'));
            if (ok.length > 0) {
              ok[0].click();
              return true;
            }
          }, longTimeout);

          await driver.wait(async function () {
            var verify = await driver.findElement(By.id('verify'));
            var submit = await driver.findElement(By.id('submit'));
            if (verify.isEnabled()) {
              var checked = await verify.isSelected();
              var enabled = await submit.isEnabled();
              if (checked && enabled) {
                submit.click();
                return true;
              } else {
                verify.click();
              }
            }
          }, longTimeout);


          await driver.wait(async function() {
            var ok = await driver.findElements(By.id('submission-success'));
            if (ok.length > 0) {
              return true;
            }
          }, longTimeout);
          console.log('Successful submission: ', i);
        });
      }
    }
  } catch (err) {
    handleFailure(err, driver);
  }
}

async function closeSession(driver) {
  try {
    await driver.get('localhost:8080/manage').then(async function() {
      await driver.wait(async function () {
        var session = driver.findElement(By.id('session'));
        var password = driver.findElement(By.id('password'));
        if (session.isDisplayed() && password.isDisplayed()) {
          session.sendKeys(sessionKey);
          password.sendKeys(sessionPassword);
          driver.findElement(By.id('login')).click();
          return true;
        }
      }, shortTimeout);

      await driver.sleep(1000);

      await driver.wait(async function () {
        const sessionStop = await driver.findElement(By.id('session-stop'));
        const enabled = await sessionStop.isEnabled();
        if (enabled) {
          await driver.sleep(500);
          sessionStop.click();
          return true;
        }
      }, longTimeout);

      await driver.wait(async function () {
        const confirm = await driver.findElement(By.id('session-close-confirm'));
        const enabled = await confirm.isEnabled();

        if (enabled) {
          await driver.sleep(500);
          confirm.click();
          return true;
        }
      }, longTimeout);
      
      await driver.wait(async function () {
        const status = await driver.findElement(By.id('session-status'));
        var text = ''

        if (status.isDisplayed()) {
          await status.getText().then(function(t) {
            text = t;
          });
        }

        if (text === 'STOPPED') {
          console.log('status: ', text);
          return true;
        }
      }, longTimeout);

      // wait for history to update
      await driver.sleep(3000); 

      for (var i = 0; i < numberOfCohorts; i++) {
        await driver.wait(async function () {
          const history = await driver.findElements(By.xpath('// *[@id="table-'+ i +'"]/tbody/tr'));
          if (history.length > 0) {
            expect(history.length).to.equal(numberOfParticipants);
            return true;
          }
        }, medTimeout);
      }

    });
  } catch (err) {
    handleFailure(err, driver);
  }
}

async function unmaskData(driver) {
  try {
    await driver.get('localhost:8080/unmask').then(async function() {
      await driver.wait(async function () {
        var session = driver.findElement(By.id('session'));
        var password = driver.findElement(By.id('session-password'));
        if (session.isDisplayed() && password.isDisplayed()) {
          session.sendKeys(sessionKey);
          password.sendKeys(sessionPassword);

          var fileUpload = await driver.findElement(By.id('choose-file'));
          var filePath = getUserHome() + '/Downloads/' + 'Session_' + sessionKey + '_private_key.pem';
          fileUpload.sendKeys(filePath);
          return true;
        }
      }, shortTimeout);
  
      var tableValues;
      await driver.wait(async function () {
        tableValues = await driver.findElements(By.xpath('//td[@class="htDimmed"]'));
        return (tableValues.length > 0);
      }, unmaskingTimeout);


      console.log('Received unmasked values')
      // check values
      for (var i = 0; i < tableValues.length; i++) {
        var value = await tableValues[i].getText();
        if (!isNaN(parseInt(value))) {
          expect(parseInt(value)).to.equal(dataValue);
        }
      }
  
      // var path = getUserHome() + '/Downloads/' + 'Aggregate_Averages_' + sessionKey + '.csv';
    
      // fs.readFile(path, {encoding: 'utf-8'}, function(err, data) {
      //   console.log('error',err);
      //   var rows = data.split('\n');

      //   for (var i = 0; i < rows.length; i++) {
      //     var values = rows[i].split(',');
      //     for (var j = 1; j < values.length; j++) {
      //       var val = parseInt(values[j]);
      //       if (!isNaN(val)) {
      //         expect(val).to.equal(dataValue);
      //       }
      //     }
      //   }
      // });
    });
  } catch (err) {
    handleFailure(err, driver);
  }
}