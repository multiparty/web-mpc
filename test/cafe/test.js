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
      .typeText('#session', '87j4egqf4jck65djg98z5r0rac')
      .typeText('#password', 'w35ajn6g43bx9yzdy8jh6dy26c')
      .click('#login')
      // .click('#session-start')
  });


const fileUpload = Selector('#choose-file');

fixture `Submitting data`
  .page `localhost:8080/`;
  test('Participant 1', async t => {
    await t
      .click('#session')
      .typeText('#session', '87j4egqf4jck65djg98z5r0rac')
      .click('#participation-code')
      .typeText('#participation-code', 'd7fbq0kxxbyxy8ghcbr505d8tg')
      .click('#expand-table-button')
      .setFilesToUpload(fileUpload, '/Users/lucyqin/Desktop/pace.xlsx')
      .click('#verify')


  });
