import { Selector } from 'testcafe';
const fs = require('fs');

let sessionKey = 'h40w1x2sr6h4jdh60wfba76ynr';
let sessionPassword = null;
let participant_codes = [];

function createSession() {
  fixture `Creating a session`
  .page `localhost:8080/create`;
  test('Creating a session', async t => {
    await t
        .typeText('#session-title', 'testing!')
        .typeText('#session-description', 'a test description')
        .click('#generate')
        .wait(5000);
  });
}

function saveSessionInfo() {
  var files = fs.readdirSync('/Users/lucyqin/Downloads/');

  for (var f of files) {
    if (f.includes('.txt')) {
      fs.readFile("/Users/lucyqin/Downloads/" + f, "utf8", function(err, data) {
        sessionKey = data.slice(12, 39);
        sessionPassword = data.slice(50, 76)
        console.log(sessionKey, sessionPassword)
        return;
      });
    }
  }
}

function startSession() { 
  fixture `Manage`
    .page `localhost:8080/manage`;
    test('Managing a session', async t => {
      await t
        .click('#session')
        .typeText('#session', sessionKey)
        .click('#password')
        .typeText('#password', sessionPassword)
        .click('#login')
        // .click('#session-start')
        .debug();
        // .click('#participants-count')
        // .debug()
        // .typeText('#participants-count', '2')
        // .debug()
        // .expect(participants.innerText).contains('http')
        // .debug();
    });
}

let participants = null;

function getParticipationCodes() { 
  fixture `Manage`
    .page `localhost:8080/manage`;
    test('Managing a session', async t => {
      await t
        .click('#session')
        .typeText('#session', sessionKey)
        .click('#password')
        .typeText('#password', sessionPassword)
        .click('#login')
        // .click('#session-start')
        .debug();
      participants = Selector('#participants-existing').innerText;


     t.expect(await participants).to.have.string('code');

     
        // .click('#participants-count')
        // .debug()
        // .typeText('#participants-count', '2')
        // .debug()
        // .expect(participants.innerText).contains('http')
        // .debug();
    });
}


// function getSessionInfo() {

// }


function unmaskData() {

  const fileUpload = Selector('#choose-file');

  fixture `Unmasking Data`
    .page `localhost:8080/unmask`;
    test('Unmasking data', async t => {
      await t
      .click('#session')
      .typeText('#session', sessionKey)
      .click('#session-password')
      .typeText('#session-password', sessionPassword)
      .setFilesToUpload(fileUpload, '/Users/lucyqin/Downloads/Session_' + sessionKey + '_private_key.pem')
      .debug();
    });
}

function uploadData() {

  const fileUpload = Selector('#choose-file');
  const okBtn = Selector('button').withText('OK');
  const verifyBtn = Selector('label').withText('I verified all data is correct');
  const successImg = Selector('img').withAttribute('src', '/images/accept.png');


  fixture `Submitting data`
    .page `localhost:8080/`;


    test('Participant 1', async t => {
      await t
        .wait(5000)
        // .click('#session')
        // .typeText('#session', 'dtt4yqce20jgm411xtefn77hew')
        .click('#participation-code')
        .selectText('#session')
        .pressKey('backspace')
        .typeText('#participation-code', 'fnrf9q61gwkdc75sbrs1js9xg0')
        .click('#session')
        .debug()
        .typeText('#session', sessionKey)
        .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
        .click(okBtn)
        .click(verifyBtn)
        .click('#submit')
        .debug()
        .expect(successImg.exists).ok();
    });

    test('Participant 2', async t => {
      await t
        .wait(5000)
        .click('#session')
        .typeText('#session', sessionKey)
        .click('#participation-code')
        .typeText('#participation-code', 'fm40e5edy40aje6zbtg8pdz198')
        .click('#expand-table-button')
        .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
        .click(okBtn)
        .click(verifyBtn)
        .click('#submit')
        .expect(successImg.exists).ok();
    });

    test('Participant 3', async t => {
      await t
        .wait(5000)
        .click('#session')
        .typeText('#session', sessionKey)
        .click('#participation-code')
        .typeText('#participation-code', 'jy9cgq64qws81605dkn26cxp5r')
        .click('#expand-table-button')
        .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
        .click(okBtn)
        .click(verifyBtn)
        .click('#submit')
        .expect(successImg.exists).ok();
    });
}

function endSession() {
  fixture `Manage`
  .page `localhost:8080/manage`;
  test('Managing a session', async t => {
    await t
      .wait(100)
      .click('#session')
      .typeText('#session', sessionKey)
      .click('#password')
      .typeText('#password', sessionPassword)
      .click('#login')
      .click('#session-stop')
      .click('#session-close-confirm')
  });
}

function massUpload() {
  fs.readFile("/Users/lucyqin/Downloads/participant_codes.txt", "utf8", function(err, data) {
    participant_codes = data.split('\n');
  });


  const fileUpload = Selector('#choose-file');
  const okBtn = Selector('button').withText('OK');
  const verifyBtn = Selector('label').withText('I verified all data is correct');
  const successImg = Selector('img').withAttribute('src', '/images/accept.png');
 


    // for (let code of participant_codes) {
    fixture `Mass submission`
      .page `localhost:8080/`;

      for (var i = 0; i < 5; i++) {
        test('Participant ' + i, async t => {
          await t
            .wait(5000)
            .click('#session')
            .typeText('#session', sessionKey)
            .click('#participation-code')
            .typeText('#participation-code', participant_codes[i])
            .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
            .click(okBtn)
            .click(verifyBtn)
            .click('#submit')
            .debug()
            .expect(successImg.exists).ok();
        });
      }





  // fixture `Submitting data`
  //   .page `localhost:8080/`;



  //   for (let code of participant_codes) {
  //     console.log('code', code);
  //     test('Participant', async t => {
  //       await t
  //         .click('#session')
  //     });

  //   }
  //   // test('Participant 1', async t => {
    //   await t
    //     .wait(5000)
    //     // .click('#session')
    //     // .typeText('#session', 'dtt4yqce20jgm411xtefn77hew')
    //     .click('#participation-code')
    //     .selectText('#session')
    //     .pressKey('backspace')
    //     .typeText('#participation-code', 'fnrf9q61gwkdc75sbrs1js9xg0')
    //     .click('#session')
    //     .debug()
    //     .typeText('#session', sessionKey)
    //     .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
    //     .click(okBtn)
    //     .click(verifyBtn)
    //     .click('#submit')
    //     .debug()
    //     .expect(successImg.exists).ok();
    // });

}

// saveSessionInfo();
// createSession();

// startSession();

// getParticipationCodes();
massUpload();
// uploadData();
// endSession();
// unmaskData();




