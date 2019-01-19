/**
 * Route endpoints for session creation and querying for session information.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

// DB Operation Wrappers
const modulesWrappers = require('../modules/modulesWrappers.js');
const helpers = require('./helpers.js');

// Export route handlers
module.exports = {};

// endpoint for creating the session
module.exports.createSession = function (context, body, res) {
  var publickey = body.publickey;
  var sessionID = helpers.generateRandomBase32(TOKEN_LENGTH);
  var password = helpers.generateRandomBase32(TOKEN_LENGTH);

  var title = body.title.split('<').join('&lt;').split('>').join('&gt;');
  var description = body.description.split('<').join('&lt;').split('>').join('&gt;');

  var promise = modulesWrappers.SessionInfo.insert(sessionID, publickey, password, title, description);
  promise.then(function () {
    console.log('Session generated for:', sessionID);

    // Initialize a JIFF computation for this session
    context.jiff.initializeSession(sessionID, publickey, password);
    console.log('JIFF Session initialized');

    // Done
    res.json({ sessionID: sessionID, password: password });
  }).catch(function (err) {
    console.log('Error in creating session', err);
    res.status(500).send('Error during session creation');
  });
};

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
