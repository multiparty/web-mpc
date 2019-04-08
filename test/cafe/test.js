import { Selector } from 'testcafe';


let sessionKey = null;
let sessionPassword = null;

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
    console.log(sessionKey, sessionPassword);
  });
}

function startSession() { 
  fixture `Start`
    .page `localhost:8080/manage`;
    test('Starting a session', async t => {
      await t
        .click('#session')
        .typeText('#session', sessionKey)
        .click('#password')
        .typeText('#password', sessionPassword)
        .click('#login')
        .wait(2000)
        .click('#session-start');
    });
}


let participants = null;

function getParticipationCodes() { 
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
        .typeText('#participants-count', numberOfParticipants.toString())
        .click('#participants-submit')
        .wait(2000);

      participants = await Selector('#participants-new').innerText;
      participants = participants.trim().split('\n');
      for (var i = 0; i < participants.length; i++) {
        participants[i] = participants[i].trim();
        if (participants[i] !== '') {
          var index = participants[i].indexOf('participationCode') + 'participationCode'.length + 1;
          participant_codes.push(participants[i].substring(index));
        }
      }

      await t.expect(participant_codes.length).eql(numberOfParticipants);
      console.log(participant_codes);
    });
}


createSession();
startSession();


