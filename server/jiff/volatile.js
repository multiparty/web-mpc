/**
 * Manages volatile state that JIFF server instances must track and use in order to deliver functionality.
 * Manages restoring this volatile state after shutdown / startup by recomputing or loading it from the DB.
 */

const modulesWrappers = require('../modules/modulesWrappers.js');

module.exports = function (JIFFWrapper) {
  // Load previously created sessions from DB into memory
  JIFFWrapper.prototype.loadVolatile = async function () {
    // Track jiff_party_ids of submitters, and which sessions have been computed / unmasked.
    // This is stored in volatile memory but must be persistent
    this.tracker = {};
    this.computed = {};

    // We have three pieces of volatile information that we need to load
    // 1. jiff session information (compute using initializeSession)
    // 2. tracker to keep track of submitters and associated public keys in serverInstance.key_map
    // 3. computed to keep track of which session have been computed.

  };

  // Keeps track of submitters IDs
  JIFFWrapper.prototype.trackParty = function (session_key, jiff_party_id) {
    if (jiff_party_id === 's1' || jiff_party_id === 1) {
      return;
    }

    this.tracker[session_key][jiff_party_id] = true;
    var promise = modulesWrappers.History.insert(session_key, jiff_party_id, true);
    return promise.catch(function (err) {
      console.log('Failed to track party', err);
      throw new Error('Error writing submission to database');
    });
  };
  JIFFWrapper.prototype.untrackParty = function (session_key, user_key) {
    var promise = modulesWrappers.UserKey.get(session_key, user_key);

    return promise.then(function (data) {
      var jiff_party_id = data.jiff_party_id;

      this.tracker[session_key][jiff_party_id] = false;
      return modulesWrappers.History.insert(session_key, jiff_party_id, false);
    }).catch(function (err) {
      console.log('Failed to un track party', err);
      throw new Error('Error writing submission to database');
    });
  };
  JIFFWrapper.prototype.getTrackerParties = function (session_key) {
    var tracked = [];
    for (var key in this.tracker[session_key]) {
      if (this.tracker[session_key].hasOwnProperty((key)) && this.tracker[session_key][key] === true) {
        tracked.push(key);
      }
    }

    tracked.sort();
    return tracked;
  };

  // Keeps track of computations that has been computed: no need to recompute these,
// can just replay messages from database.
  JIFFWrapper.prototype.trackComputed = function (session_key) {
    this.computed[session_key] = true;
  };
  JIFFWrapper.prototype.hasBeenComputed = function (session_key) {
    return this.computed[session_key] === true;
  };
};
