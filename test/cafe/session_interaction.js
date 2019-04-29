/*const PACESETTERS = 'pacesetters';
const BWWC = 'bwwc';
*/
//let deployment = BWWC;
let sessionKey = null;
let sessionPassword = null;

// FILL THESE IN
const numberOfParticipants = 2;
const cohortNumber = 1;
const participant_codes = [];
const participant_links = [];
const browsers = ['chrome', 'firefox', 'edge']
/*const downloadFolder = getUserHome() + '/Downloads/';
const dataFile = './files/' + deployment + '.xlsx';*/

const {Builder, By, Key, until} = require('selenium-webdriver');

async function createSession(driver){
  driver.sleep(1000);
  try {

    await driver.get('localhost:8080/create')
      .then(() => driver.findElement(By.id('session-title')) )
      .then((title) =>  title.sendKeys('test-session') )
      .then(() => driver.findElement(By.id('session-description')) )
        .then((description) => description.sendKeys('test-session description') )
        .then(() => driver.findElement(By.id('generate')).click() )

    // wait for sessionKey to be displayed
    await driver.wait(function() {
      return driver.findElement(By.id('sessionID')).isDisplayed();
    }, 10000);
    // save session key
    await driver.findElement(By.id('sessionID'))
      .then(elem => elem.getText()
        .then(function (text) {
          sessionKey = text;
          //console.log('sessionKey', text);
        }));
    // wait for sessionPassword to be displayed
    await driver.wait(function() {
      return driver.findElement(By.id('passwordID')).isDisplayed();
    }, 10000);
    //save sessionPassword
    await driver.findElement(By.id('passwordID'))
      .then(elem => elem.getText()
        .then(function (text) {
          sessionPassword = text;
        }));

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
      }) );
  } catch (err) {
    handleFailure(err, driver);
  }

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
          var filePath = process.cwd() + '/files/bwwc.xlsx';
          fileUpload.sendKeys(filePath);
          //fileUpload.click();
          //driver.sleep(5000);

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
        });
    }
  } catch (err) {
    handleFailure(err, driver);
  }
}
async function closeSession(driver, originalTab) {
  try {
    //switch back to manage page
    await driver.switchTo().window(originalTab);
    // stop session
    var stopButton = await driver.findElement(By.id('session-stop'));
    stopButton.click();
    // press okay
    await driver.sleep(500);
    var confirmButton = await driver.findElement(By.id('session-close-confirm'));
    confirmButton.click();

    // unmask
    await driver.sleep(500);
    // click link to unmask page
    await driver.findElement(By.xpath('//a[.="here"]'))
      .then((manageLink) => manageLink.click());
  } catch (err) {
    handleFailure(err, driver);
  }

}

function getUserHome() {
  return process.env.HOME || process.env.USERPROFILE;
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
        console.assert(parseInt(value) === numberOfParticipants);
      }
    }
  } catch (err) {
    handleFailure(err, driver);
  }
}


async function runTests() {
  for (var browser of browsers) {
    let driver = new Builder().forBrowser(browser).build();
    var originalTab = driver.getWindowHandle();

    await createSession(driver);
    await dataSubmission(driver, originalTab);
    await closeSession(driver, originalTab);
    await unmaskData(driver);
    await driver.quit();
    //
  }
}
runTests();

function handleFailure(err, driver) {
  console.error('Something went wrong!\n', err.stack, '\n');
  driver.takeScreenshot();
  driver.quit();
}
