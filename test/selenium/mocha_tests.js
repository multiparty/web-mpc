const assert = require('assert');
// const test = require('selenium-webdriver/testing');
const webdriver = require('selenium-webdriver');
const {Builder, By, Key, until} = require('selenium-webdriver');
const expect = require('chai').expect;

let sessionKey = null;
let sessionPassword = null;


// FILL THESE IN
const numberOfParticipants = 2;
// const cohortNumber = 1;
const participant_codes = [];
const participant_links = [];


var driver = new webdriver.Builder()
.withCapabilities(webdriver.Capabilities.chrome())
.build();


function getUserHome() {
  return process.env.HOME || process.env.USERPROFILE;
}


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
      }) );
  });

  // it('Data submission', async() => {
  
  //   try {
  
  //     await driver.get(participant_links[0])
  //       .then(async function() {
  //         var sessionSuccess = await driver.findElement(By.id('session-success'));

  //         expect(sessionSuccess).to.exist;

  //         var fileUpload = await driver.findElement(By.id('choose-file'));
  //         var filePath = process.cwd() + '/test/selenium/files/bwwc.xlsx';
  //         fileUpload.sendKeys(filePath);

  //         // await driver.wait( function() {
  //         //   var okay driver.findElements(By.className('ajs-ok');

  //         // })
  //         // await driver.findElements(By.className('ajs-ok'))
  //         //   .then(function(ok) {
  //         //     if (ok.length > 0) {
  //         //       ok[0].click();
  //         //     } else {
  //         //       assert.fail('Data failed to upload.');
  //         //     }
  //         //   });

          
  //         var surveyOpts = await driver.findElements(By.xpath('//input[@name="optradio" and @value="1"]'));
  //         if (surveyOpts[0].isSelected()) {
  //           for (var k = 0; k < surveyOpts.length; k++) {
  //             surveyOpts[k].click();
  //           }
  //         } else {
  //           assert.fail('Survey failure.')
  //         }

  //         var verifyBox = await driver.findElement(By.id('verify'));
  //         verifyBox.click();


  //       });

      
  //       // await driver.wait(async function() {
  //       // }, 5000);
  //     } catch(err) {
  //       console.log('err', err)
  //       assert.fail('Data submission failure')
  //     }

  // });

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
  after(async () => driver.quit());
});