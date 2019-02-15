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
    res.send(status);
  }).catch(function (err) {
    console.log('Error in getting session status', err);
    res.status(500).send('Error getting session status.');
  });
};

// endpoint for setting session status
module.exports.setStatus = function (context, body, response, sessionInfoObj) {
  if (sessionInfoObj.status === 'STOP') {
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
  var promise1 = modulesWrappers.History.query(body.session, body.last_fetch);
  var promise2 = modulesWrappers.History.count(body.session);

  Promise.all([promise1, promise2]).then(function (data) {
    var count = data[1];
    var history = data[0];

    // only send the most recent submission per id
    var id_last_index = {};
    var to_send = [];

    for (var d of history) {
      if (d.success === true) {
        to_send.push(d.date);
        if (id_last_index[d.jiff_party_id] != null) {
          to_send[id_last_index[d.jiff_party_id]] = null;
        }
        id_last_index[d.jiff_party_id] = to_send.length - 1;
      }
    }

    // efficiently remove nulls.
    var shift = 0;
    for (var i = 0; i < to_send.length; i++) {
      var current = to_send[i];
      if (current == null) {
        shift++;
      } else {
        to_send[i-shift] = current;
      }
    }
    to_send = to_send.slice(0, to_send.length - shift);

    res.json({ history: to_send, count: count });
  }).catch(function (err) {
    console.log('Error getting submission history', err);
    res.status(500).send('Failed to fetch contributors.');
  });
};
