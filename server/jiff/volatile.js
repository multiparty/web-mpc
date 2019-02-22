/**
 * Manages volatile state that JIFF server instances must track and use in order to deliver functionality.
 * Manages restoring this volatile state after shutdown / startup by recomputing or loading it from the DB.
 */

const modulesWrappers = require('../modules/modulesWrappers.js');

module.exports = function (JIFFWrapper) {
  // Load previously created sessions from DB into memory
  JIFFWrapper.prototype.loadVolatile = async function () {
    var self = this;

    // We have one piece of volatile information that we need to load:
    // 1. jiff session information (compute using initializeSession)
    var promise = modulesWrappers.SessionInfo.all();
    return promise.then(async function (sessions) {
      for (var session of sessions) {
        var session_key = session.session;
        var public_key = session.pub_key;
        var password = session.password;

        // Load session information
        await self.initializeSession(session_key, public_key, password);
      }

      // loaded successfully
      return true;
    });
  };
};
