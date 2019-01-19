const modulesWrappers = require('../modules/modulesWrappers.js');

// Helper that verifies the session status
function verifyStatus(sessionKey, expectedStatus) {
  var promise = modulesWrappers.SessionInfo.get(sessionKey);

  return promise.catch(function (err) {
    console.log('Error verifying status', err);
    throw new Error('Error while verifying session status');
  }).then(function (data) {
    const actualStatus = data ? data.status : 'PAUSE';
    if (expectedStatus === actualStatus) {
      return true;
    } else {
      console.log('bad session');
      throw new Error('Session status is ' + actualStatus);
    }
  });
}

// Do not allow client parties to connect to session with status != 'START'
async function sessionStatus(jiff, operation, computation_id, party_id, msg) {
  // return message or throw string error
  if (operation !== 'poll' || party_id === 's1') {
    return msg;
  }

  // Analyst connect when they want to compute the results, the status must be STOP
  // Clients connect to submit, the status must be START
  await verifyStatus(computation_id, party_id === 1 ? 'STOP' : 'START'); // if failed, this will throw an error

  return msg;
}

module.exports = {
  beforeOperation: [sessionStatus],
};
