import { Selector } from 'testcafe';

fixture `Creating a session`
  .page `localhost:8080/create`;
  test('Creating a session', async t => {
    await t
        .typeText('#session-title', 'testing!')
        .typeText('#session-description', 'a test description')
        .click('#generate')


  });

fixture `Starting a session`
  .page `localhost:8080/manage`;
  test('Starting a session', async t => {
    await t
    

  });

