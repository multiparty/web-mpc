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
  var promise2 = modulesWrappers.UserKey.query(body.session);

  Promise.all([promise1, promise2]).then(function (data) {
    var cohortMap = {};
    for (var k of data[1]) {
      cohortMap[k.jiff_party_id] = k.cohort;
    }
    var history = data[0];

    // only send the most recent submission per id
    var id_last_index = {};
    var to_send = {}; // maps cohort number to submissions

    for (var d of history) {
      if (d.success === true) {
        var cohort = cohortMap[d.jiff_party_id];
        var arr = to_send[cohort];
        if (arr == null) {
          arr = [];
        }

        arr.push(d.date);
        if (id_last_index[d.jiff_party_id] != null) {
          arr[id_last_index[d.jiff_party_id]] = null;
        }
        id_last_index[d.jiff_party_id] = arr.length - 1;

        to_send[cohort] = arr;
      }
    }

    // efficiently remove nulls.
    for (cohort in to_send) {
      if (!to_send.hasOwnProperty(cohort)) {
        continue;
      }

      var arr = to_send[cohort];
      var shift = 0;
      var count = arr.length;
      for (var i = 0; i < arr.length; i++) {
        var current = arr[i];
        if (current == null) {
          shift++;
        } else {
          arr[i - shift] = current;
        }
      }
      to_send[cohort] = {history: arr.slice(0, arr.length - shift), count: count};
    }

    res.json(to_send);
  }).catch(function (err) {
    console.log('Error getting submission history', err);
    res.status(500).send('Failed to fetch contributors.');
  });
};
