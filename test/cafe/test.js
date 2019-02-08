import { Selector } from 'testcafe';



function getFile() {

  var txt = '';
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
      txt = xmlhttp.responseText;
    }
  };
  xmlhttp.open("GET","abc.txt",true);
  xmlhttp.send();
  
}

// fixture `Creating a session`
//   .page `localhost:8080/create`;
//   test('Creating a session', async t => {
//     await t
//         .typeText('#session-title', 'testing!')
//         .typeText('#session-description', 'a test description')
//         .click('#generate')
//   });

// const participants = Selector('#participants-existing')

// fixture `Manage`
//   .page `localhost:8080/manage`;
//   test('Managing a session', async t => {
//     await t
//       .click('#session')
//       .typeText('#session', '87j4egqf4jck65djg98z5r0rac')
//       .click('#password')
//       .typeText('#password', 'w35ajn6g43bx9yzdy8jh6dy26c')
//       .click('#login')
//       .debug()
//       .expect(participants.innerText).contains('http');

//       // .debug();
//       // .click('#session-start')
//       // console.log('value', participants.innerText);
//   });


unmaskData();
// uploadData();

function unmaskData() {

  const fileUpload = Selector('#choose-file');

  fixture `Unmasking Data`
    .page `localhost:8080/unmask`;
    test('Unmasking data', async t => {
      await t
      .click('#session')
      .typeText('#session', '3jpar7nzcmzz4q2zmb30sk0p4m')
      .click('#session-password')
      .typeText('#session-password', 'jetk5zdmmedamsrtafr330fz2g')
      .setFilesToUpload(fileUpload, '/Users/lucyqin/Downloads/Session_3jpar7nzcmzz4q2zmb30sk0p4m_private_key.pem')
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
        .typeText('#session', '3jpar7nzcmzz4q2zmb30sk0p4m')
        .click('#participation-code')
        .typeText('#participation-code', 'fkyjmmjjygfm20fpacmgnhgxfm')
        .click('#expand-table-button')
        .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
        .click(okBtn)
        .click(verifyBtn)
        .click('#submit')
        .debug()
        .expect(successImg.exists).ok();
    });

    test('Participant 2', async t => {
      await t
        .click('#session')
        .typeText('#session', '3jpar7nzcmzz4q2zmb30sk0p4m')
        .click('#participation-code')
        .typeText('#participation-code', 'e12kvhf4w2j01wmg3knhva7zqg')
        .click('#expand-table-button')
        .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
        .click(okBtn)
        .click(verifyBtn)
        .click('#submit')
        .expect(successImg.exists).ok();
    });
}
