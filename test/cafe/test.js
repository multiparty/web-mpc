import { Selector, ClientFunction } from 'testcafe';
const fs = require('fs');

let sessionKey = null;
let sessionPassword = null;

// function getFile() {

//   var txt = '';
//   var xmlhttp = new XMLHttpRequest();
//   xmlhttp.onreadystatechange = function(){
//     if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
//       txt = xmlhttp.responseText;
//     }
//   };
//   xmlhttp.open("GET","abc.txt",true);
//   xmlhttp.send();
  
// }

function createSession() {
  fixture `Creating a session`
  .page `localhost:8080/create`;
  test('Creating a session', async t => {
    await t
        .typeText('#session-title', 'testing!')
        .typeText('#session-description', 'a test description')
        .click('#generate')
        .wait(10000);
       
  });
}
  // const participants = Selector('#participants-existing')

function saveSessionInfo() {
  var files = fs.readdirSync('/Users/lucyqin/Downloads/');

  for (var f of files) {
    console.log(f)
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
        .wait(1000)
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
      .setFilesToUpload(fileUpload, '/Users/lucyqin/Downloads/Session_' + sessionKey + '_private_key')
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
        .click('#session')
        .typeText('#session', 'dtt4yqce20jgm411xtefn77hew')
        .click('#participation-code')
        .typeText('#participation-code', 'rh1k0xsnx7w7r7mdeq22qp6hxr')
        .click('#session', sessionKey)
        .click('#expand-table-button')
        .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
        .click(okBtn)
        .click(verifyBtn)
        .click('#submit')
        // .debug()
        .expect(successImg.exists).ok();
    });

    // test('Participant 2', async t => {
    //   await t
    //     .click('#session')
    //     .typeText('#session', sessionKey)
    //     .click('#participation-code')
    //     .typeText('#participation-code', 'rh1k0xsnx7w7r7mdeq22qp6hxr')
    //     .click('#expand-table-button')
    //     .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
    //     .click(okBtn)
    //     .click(verifyBtn)
    //     .click('#submit')
    //     .debug()
    //     .expect(successImg.exists).ok();
    // });

    // test('Participant 3', async t => {
    //   await t
    //     .click('#session')
    //     .typeText('#session', sessionKey)
    //     .click('#participation-code')
    //     .typeText('#participation-code', '4rsfyf9d5wjvywc4rf8gqz6m68')
    //     .click('#expand-table-button')
    //     .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
    //     .click(okBtn)
    //     .click(verifyBtn)
    //     .click('#submit')
    //     .debug()
    //     .expect(successImg.exists).ok();
    // });

}


function endSession() {
  fixture `Manage`
  .page `localhost:8080/manage`;
  test('Managing a session', async t => {
    await t
      .wait(1000)
      .click('#session')
      .typeText('#session', sessionKey)
      .click('#password')
      .typeText('#password', sessionPassword)
      .click('#login')
      .click('#session-stop')
      .click('#session-close-confirm')
      .debug();
      // .click('#participants-count')
      // .debug()
      // .typeText('#participants-count', '2')
      // .debug()
      // .expect(participants.innerText).contains('http')
      // .debug();
  });

}

// createSession();
saveSessionInfo();
// startSession();
uploadData();
// endSession();
// unmaskData();