/**
 * Route endpoints for client: acquiring public key for a session, validating session and user keys, and submitting data.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

const Promise = require('bluebird');

// Mongo Modules Operation Wrappers
const modulesWrappers = require('../modules/modulesWrappers.js');

// Export route handlers
module.exports = {};

// endpoint for verifying user and session key and getting the session info.
module.exports.getSessionInfo = function (context, body, response) {
  var promise = modulesWrappers.SessionInfo.get(body.session);

  promise.then(function (data) {
    if (data) {
      response.send({ title: data.title, description: data.description });
    } else {
      response.status(500).send('Invalid session key.');
    }
  }).catch(function (err) {
    console.log('Error getting session info', err);
    response.status(500).send('Error while fetching data.');
  });
};
