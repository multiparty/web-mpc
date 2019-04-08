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


createSession();
startSession();


