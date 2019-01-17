/**
 * Route endpoints for client: acquiring public key for a session, validating session and user keys, and submitting data.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

const Promise = require('bluebird');

// Mongo Modules
const modules = require('../modules/modules.js');

// Export route handlers
module.exports = {};

// endpoint for verifying user and session key and getting the session info.
module.exports.getSessionInfo = function (context, body, response) {
  modules.SessionInfo.findOne({ session: body.session }, function (err, data) {
    if (err) {
      console.log(err);
      response.status(500).send('Error while fetching data.');
      return;
    }

    if (data) {
      response.send({ title: data.title, description: data.description });
    } else {
      response.status(500).send('Invalid session key.');
    }
  });
};
