import { Selector, ClientFunction } from 'testcafe';

const PACESETTERS = 'pacesetters';
const BWWC = 'bwwc';

let deployment = BWWC;
let sessionKey = null;
let sessionPassword = null;
let participant_codes = [];

// FILL THESE IN
const numberOfParticipants = 2;
const cohortNumber = 1;
const downloadFolder = getUserHome() + '/Downloads/';
const dataFile = './files/' + deployment + '.xlsx';

function getUserHome() {
  return process.env.HOME || process.env.USERPROFILE;
}

function createSession() {
  fixture `Creating a session`
  .page `localhost:8080/create`;
  test('Creating a session', async t => {
    await t
        .typeText('#session-title', 'testing!')
        .typeText('#session-description', 'a test description')
        .click('#generate')
        .wait(2000);
    

    sessionKey = (await Selector('#sessionID').innerText).trim();
    sessionPassword = (await Selector('#passwordID').innerText).trim();
  });
}

function getParticipationCodes() { 
  console.log(sessionKey, sessionPassword)
  fixture `Participation Codes`
    .page `localhost:8080/manage`;
    test('Generating Participation codes', async t => {
      await t
        .click('#session')
        .typeText('#session', sessionKey)
        .click('#password')
        .typeText('#password', sessionPassword)
        .click('#login')
        .wait(3000)
        .typeText('#cohort-number', cohortNumber.toString())
        .click('#cohort-generate')
        .click('#session-start');

      for (var i = 0; i < cohortNumber; i++) {
        await Selector('#participants-count-' + i);
        await t
              .typeText('#participants-count-' + i, numberOfParticipants.toString())
              .click('#participants-submit-' + i);

        let participants = await Selector("#participants-new-" + i).innerText;
        participants = participants.trim().split('\n');
      
        for (var j = 0; j < participants.length; j++) {
          participants[j] = participants[j].trim();
          if (participants[j] !== '') {
            var index = participants[j].indexOf('participationCode') + 'participationCode'.length + 1;
            participant_codes.push(participants[j].substring(index));
         }
        }
      }  
      await t.expect(participant_codes.length).eql(numberOfParticipants * cohortNumber);
      console.log(participant_codes);
    });
}



function massUpload() {
  const fileUpload = Selector('#choose-file');
  const okBtn = Selector('button').withText('OK');

  fixture `Mass submission`
    .page `localhost:8080/`;

    test('Mass Participants Upload', async t => {
      for (var i = 0; i < participant_codes.length; i++)
        await t
          .wait(1000)
          .selectText('#session')
          .pressKey('delete')
          .click('#session')
          .typeText('#session', sessionKey)
          .selectText('#participation-code')
          .pressKey('delete')
          .click('#participation-code')
          .typeText('#participation-code', participant_codes[i])
          .setFilesToUpload(fileUpload, dataFile)
          .click(okBtn)
          .click('#verify')
          .click('#submit')
          .wait(2500)
          .click('.ajs-ok');
    });
}

function endSession() {
  fixture `Stop`
    .page `localhost:8080/manage`;
    test('Stopping a session', async t => {
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

function unmaskData() {
  const fileUpload = Selector('#choose-file');

  const checkValues = ClientFunction(numParticipants => {
    $('td').each(function() {
      var tableValue = ($(this).html());
      if (!(isNaN(parseInt(tableValue)))) {
        if (tableValue !== numParticipants) {
          return false;
        }
      }
    });
    return true;
  });
  

  fixture `Unmasking`
    .page `localhost:8080/unmask`;
    test('Unmasking data', async t => {
      await t
      .click('#session')
      .typeText('#session', sessionKey)
      .click('#session-password')
      .typeText('#session-password', sessionPassword)
      .setFilesToUpload(fileUpload, downloadFolder+'Session_' + sessionKey + '_private_key.pem')
      .wait(3000)
      .expect(checkValues(numberOfParticipants)).eql(true);
    });
}



createSession();
getParticipationCodes();
massUpload();
endSession();
unmaskData();