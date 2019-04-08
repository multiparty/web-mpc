import { Selector } from 'testcafe';

function createSession() {
  fixture `Creating a session`
  .page `localhost:8080/create`;
  test('Creating a session', async t => {
    await t
        .typeText('#session-title', 'testing!')
        .typeText('#session-description', 'a test description')
        .click('#generate')
        .wait(2000);
        
    // sessionKey = (await Selector('#sessionID').innerText).trim();
    // sessionPassword = (await Selector('#passwordID').innerText).trim();
    // console.log(sessionKey, sessionPassword);
  });
}


createSession();


