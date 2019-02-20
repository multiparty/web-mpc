/**
 * Route endpoints for session status and history: getting and setting status, querying for NON-LEAKY submission history.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

// DB Operation Wrappers
const modulesWrappers = require('../modules/modulesWrappers.js');

// Export route handlers
module.exports = {};

// endpoint for getting the status of a session
module.exports.getStatus = function (context, body, res) {
  var promise = modulesWrappers.SessionInfo.get(body.session);

  promise.then(function (data) {
    var status = data ? data.status : 'PAUSE';
    var cohorts = data.cohorts;
    res.json({status: status, cohorts: cohorts});
  }).catch(function (err) {
    console.log('Error in getting session status', err);
    res.status(500).send('Error getting session status.');
  });
};

// endpoint for setting session status
module.exports.setStatus = function (context, body, response, sessionInfoObj) {
  if (sessionInfoObj.status !== 'PAUSE') {
    response.status(500).send('Session status is ' + sessionInfoObj.status);
    return;
  }

  // no need to verify status, joi already did it
  sessionInfoObj.status = body.status;

  // Update sessionInfo in database
  var promise = modulesWrappers.SessionInfo.update(sessionInfoObj);
  promise.then(function () {
    console.log('Session Status:', body.session, body.status);
    if (body.status === 'STOP') {
      context.jiff.computeSession(body.session);
    }
    response.json({result: body.status});
  }).catch(function (err) {
    console.log('Error setting session status', err);
    response.status(500).send('Error during session status update.');
  });
};

// endpoint for returning dates of submissions
module.exports.getSubmissionHistory = function (context, body, res) {
  var promise = modulesWrappers.History.query(body.session, body.last_fetch);

  promise.then(function (data) {
    var to_send = [];
    for (var d of data) {
      if (d.success === true) {
        to_send.push(d.date);
      }
    }

    res.json({ result: to_send });
  }).catch(function (err) {
    console.log('Error getting submission history', err);
    res.status(500).send('Failed to fetch contributors.');
  });
};
