const modules = require('../modules/modules.js');
var Promise = require('bluebird');

// Helper that verifies the session status
function verifyStatus(sessionKey, expectedStatus) {
  console.log(sessionKey, expectedStatus);
  return new Promise(function (resolve, reject) {
    modules.SessionInfo.findOne({_id: sessionKey}, function (err, data) {
      if (err) {
        reject('Error while verifying participation code.');
        return;
      }

      const actualStatus = data ? data.status : 'PAUSE';
      if (expectedStatus === actualStatus) {
        resolve(true);
      } else {
        reject('Session status is ' + actualStatus);
      }
    });
  });
}

// Do not allow client parties to connect to session with status != 'START'
async function prePoll(jiff, operation, computation_id, party_id, msg) {
  // return message or throw string error
  if (operation !== 'poll') {
    return msg;
  }

  if (party_id !== 's1' && party_id !== 1) {
    try {
      await verifyStatus(computation_id, 'START');
      return msg;
    } catch (err) {
      throw err;
    }
  }
}

function postPoll(jiff, operation, computation_id, party_id, msg) {
  // return message or throw string error
  console.log(operation, party_id, msg);
  return msg;
}

module.exports = {
  beforeOperation: [prePoll],
  afterOperation: [postPoll]
};
