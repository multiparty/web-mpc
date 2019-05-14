const assert = require('assert');
{ describe , before , after , it }  require('selenium-webdriver/testing');
const webdriver = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');
const expect = require('chai').expect;
let chrome = require('selenium-webdriver/chrome');
let path = require('chromedriver').path;
const fs = require('fs');

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
    try {
      driver.get('http://localhost:8080/manage');

      await driver.findElement(By.id('session'))
        .then((session) => session.sendKeys(sessionKey));
    
      await driver.findElement(By.id('password'))
        .then((password) => password.sendKeys(sessionPassword))
        //click submit button
        .then(() => driver.findElement(By.id('login')).click());
      

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
        .then((partCount) => partCount.sendKeys(numberOfParticipants.toString()) )
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
          console.log(participant_links);
        }) );
    } catch (e) {
      assert.fail('Participation link generation failure', e)
    }
  });

  it('Data submission', async() => {
    var originalTab = driver.getWindowHandle();
    await dataSubmission(driver, originalTab);

    // try {
    //   for (var l of participant_links) {

    //     await driver.get('http://localhost:8080').then(async function() {

    //       const session = await driver.findElement(By.id('session'));
    //       session.click();
    //       session.sendKeys(sessionKey);

    //       const participationCode = await driver.findElement(By.id('participation-code'));
    //       participationCode.click();
    //       participationCode.sendKeys(l.split('&participationCode=')[1]);

    //       var sessionSuccess = await driver.findElement(By.id('session-success'));

    //       expect(sessionSuccess).to.exist;

    //       var fileUpload = await driver.findElement(By.id('choose-file'));
    //       var filePath = process.cwd() + '/test/selenium/files/bwwc.xlsx';
          
    //       fs.open(filePath, 'r', (err, fd) => {
    //         if (err) {
    //           console.log('error', err);
    //         } else {
    //           console.log('success');
    //         }
    //       });
    //       await fileUpload.sendKeys(filePath);

    //       await driver.findElements(By.className('ajs-ok'))
    //       .then(function(ok) {
    //         if (ok.length > 0) {
    //           ok[0].click();
    //         } else {
    //           assert.fail('Data failed to upload.');
    //         }
    //       });
          
    //       var surveyOpts = await driver.findElements(By.xpath('//input[@name="optradio" and @value="1"]'));
    //       if (surveyOpts[0].isSelected()) {
    //         for (var k = 0; k < surveyOpts.length; k++) {
    //           surveyOpts[k].click();
    //         }
    //       } else {
    //         assert.fail('Survey failure.')
    //       }

                
    //       var verifyBox = await driver.findElement(By.id('verify'));
    //       verifyBox.click();

    //       driver.sleep(10000);
    //       var button = await driver.findElement(By.id('submit'));
    //       button.click();
          
    //       await driver.findElements(By.className('ajs-ok'))
    //       .then(function(ok) {
    //         if (ok.length > 0) {
    //           ok[0].click();
    //         } else {
    //           assert.fail('Data failed to upload.');
    //         }
    //       });

    //       var success = await driver.findElements(By.id('submission-success-btn'));
    //       expect(success).to.exist;
    //     });
    //   }

    // } catch(err) {
    //   console.log('err', err)
    //   assert.fail('Data submission failure', err)
    // }
  });

  // it('Close session', async() => {
  //   try {
  //     driver.get('http://localhost:8080/manage');

  //     await driver.findElement(By.id('session'))
  //       .then((session) => session.sendKeys(sessionKey));
    
  //     await driver.findElement(By.id('password'))
  //       .then((password) => password.sendKeys(sessionPassword))
  //       //click submit button
  //       .then(() => driver.findElement(By.id('login')).click());

  //     await driver.sleep(200);
  //     await driver.wait(function() {
  //       return driver.findElement(By.id('session-stop')).isDisplayed();
  //     }, 20000);
  //     //start session
  //     await driver.findElement(By.id('session-stop'))
  //       .then((stopButton) => stopButton.click());


  //     await driver.sleep(500);
  //     var confirmButton = await driver.findElement(By.id('session-close-confirm'));
  //     confirmButton.click();

  //     // TODO: check submission table rows = # submissions
  //     await driver.findElement(By.id('table'))
  //       .then((table) => expect(table).to.exist);
        
  //   } catch (e) {
  //     assert.fail('Closing session failure', e)
  //   }
  // });


  function handleFailure(err, driver) {
    // driver.takeScreenshot();
    assert.fail('Error: ', err)
    driver.quit();
  }

  async function dataSubmission(driver, originalTab) {
    try {
      await driver.wait(function () {
        //console.log('waiting for session to be created', participant_links);
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
        //console.log(participant_links[i]);
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
            await driver.sleep(3000);
            var success = await driver.findElements(By.id('submission-success-btn'));
            expect(success).to.exist;
  
          });
      }
    } catch (err) {
      handleFailure(err, driver);
    }
  }

  // it('Unmask submission', async() => {
  //   try {
  //     await driver.sleep(500);
  //     driver.findElement(By.id('session'))
  //       .then((key) =>  key.sendKeys(sessionKey) )
  //       .then(() => driver.findElement(By.id('session-password')) )
  //       .then((password) => password.sendKeys(sessionPassword) )
  //     await driver.sleep(500);
  //     var fileUpload = await driver.findElement(By.id('choose-file'));
  //     var filePath = getUserHome() + '/Downloads/' + 'Session_' + sessionKey + '_private_key.pem'
  //     fileUpload.sendKeys(filePath);
  
  
  //     var tableValues;
  //     await driver.wait(async function () {
  //       tableValues = await driver.findElements(By.xpath('//td[@class="htDimmed"]'));
  //       return (tableValues.length > 0);
  //     }, 5000);
  
  //     // check values
  //     for (var i = 0; i < tableValues.length; i++) {
  //       var value = await tableValues[i].getText();
  //       if (!isNaN(parseInt(value))) {
  //         console.assert(parseInt(value) === numberOfParticipants);
  //       }
  //     }
  //   } catch (err) {
  //     handleFailure(err, driver);
  //   }

  // });
});