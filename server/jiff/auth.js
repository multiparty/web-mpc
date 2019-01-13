var Promise = require('bluebird');
var auth = require('../modules/auth.js');

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

module.exports = {
  beforeInitialization: [
    function (jiff, computation_id, msg, params) {
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
