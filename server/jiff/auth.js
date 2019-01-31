const Promise = require('bluebird');
const auth = require('../app/auth.js');
const modulesWrappers = require('../modules/modulesWrappers.js');

// Wrappers around ../app/auth.js
function analystAuth(computation_id, msg, params) {
  return new Promise(function (resolve, reject) {
    auth.password({ session: computation_id, password: msg['password'] }, function (success, data) {
      if (!success) {
        reject(new Error(data));
      } else {
        resolve(params);
      }
    });
  });
}

function userAuth(computation_id, msg, params) {
  return new Promise(function (resolve, reject) {
    auth.userKey({ session: computation_id, userkey: msg['userkey'] }, function (success, data) {
      if (!success) {
        reject(new Error(data));
      } else {
        // Give party a consistent id (will remain the same when reconnecting / resubmitting)
        params.party_id = data.jiff_party_id;
        resolve(params);
      }
    });
  });
}

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
      throw new Error('Session status is ' + actualStatus);
    }
  });
}

module.exports = {
  beforeOperation: [
    async function (jiff, operation, computation_id, party_id, msg) {
      // return message or throw string error
      if (operation !== 'poll' || party_id === 's1') {
        return msg;
      }

      // Analyst connect when they want to compute the results, the status must be STOP
      // Clients connect to submit, the status must be START
      await verifyStatus(computation_id, party_id === 1 ? 'STOP' : 'START'); // if failed, this will throw an error

      if (party_id !== 1 && party_id != null) {
        // For submitters, track them as non-submitters on submission start (in case of failures)
        // and when submission is successful, track them as submitters.
        await jiff._wrapper.trackParty(computation_id, party_id, false);
      }
      return msg;
    }
  ],
  afterOperation: [
    // This is not really about authentication, but tracking submitters.
    async function (jiff, operation, computation_id, party_id, msg) {
      // return message or throw string error
      if (operation !== 'poll' || party_id === 's1' || party_id === '1') {
        // Not a submitter / submission
        return msg;
      }

      // Do not add initializations to history, only submissions.
      if (msg['initialization'] == null) {
        await jiff._wrapper.trackParty(computation_id, party_id, true);
      }
      return msg;
    }
  ],
  beforeInitialization: [
    function (jiff, computation_id, msg, params) {
      // Internal: no authentication
      if (params.party_id === 's1') {
        return msg;
      }

      // Authenticate as analyst
      if (params.party_id === 1) {
        return analystAuth(computation_id, msg, params);
      }

      // Authenticate as data owner party
      else if (params.party_id == null) {
        return userAuth(computation_id, msg, params);
      }

      else {
        throw new Error('Party must either request to be the analyst (party_id = 1) or an non-specific party (party_id = null) with a userkey');
      }
    }
  ],
  onInitializeUsedId: function (jiff, computation_id, party_id, party_count, msg) {
    // Allow anyone to join computation as long as they are authenticated
    return party_id;
  }
};
