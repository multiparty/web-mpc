/**
 * Route endpoints for analyst management API: creating sessions, managing client URLs, and managing session state.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

const base32Encode = require('base32-encode');
const crypto = require('crypto');
const MAX_SIZE = 10000;

const TOKEN_LENGTH = 16;
function generateRandomBase32(length) {
  return base32Encode(crypto.randomBytes(length), 'Crockford').toString().toLowerCase()
}

// DB Operation Wrappers
const modulesWrappers = require('../modules/modulesWrappers.js');

// Export route handlers
module.exports = {};

// endpoint for creating the session
module.exports.createSession = function (context, body, res) {
  var publickey = body.publickey;
  var sessionID = generateRandomBase32(TOKEN_LENGTH);
  var password = generateRandomBase32(TOKEN_LENGTH);

  var title = body.title.split('<').join('&lt;').split('>').join('&gt;');
  var description = body.description.split('<').join('&lt;').split('>').join('&gt;');

  var promise = modulesWrappers.SessionInfo.insert(sessionID, publickey, password, title, description);
  promise.then(function () {
    console.log('Session generated for:', sessionID);

    // Initialize a JIFF computation for this session
    context.jiff.initializeSession(sessionID, publickey, password, MAX_SIZE);
    console.log('JIFF Session initialized');

    // Done
    res.json({ sessionID: sessionID, password: password });
  }).catch(function (err) {
    console.log('Error in creating session', err);
    res.status(500).send('Error during session creation');
  });
};

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
      to_send.push(d.date);
    }

    res.json({ result: to_send });
  }).catch(function (err) {
    console.log('Error getting submission history', err);
    res.status(500).send('Failed to fetch contributors.');
  });
};

// endpoint for returning previously created client urls
module.exports.getClientUrls = function (context, body, res) {
  // Password verified already by authentication!
  var promise = modulesWrappers.UserKey.query(body.session);

  promise.then(function (data) {
    var urls = [];
    for (var d of data) {
      urls.push('?session=' + body.session + '&participationCode=' + d.userkey);
    }

    console.log('URLs fetched:', body.session);
    res.json({ result: urls });
  }).catch(function (err) {
    console.log('Error in getting client urls', err);
    res.status(500).send('Error getting participation codes.')
  });
};


// endpoint for creating new client urls
module.exports.createClientUrls = function (context, body, response) {
  var promise = modulesWrappers.UserKey.query(body.session);
  promise.then(function (data) {
    var count = 1 + data.length; // starts at 1, because the first party is the analyst
    if (body.count + count > MAX_SIZE) {
      response.status(500).send('Maximum size exceeded by query, only ' + (MAX_SIZE - count) + ' parties can be added.');
      return;
    }

    var userKeys = {}; // fast lookup
    var jiffIds = {}; // fast lookup
    for (var d of data) {
      userKeys[d.userkey] = true;
      jiffIds[d.jiff_party_id] = true;
    }

    // Create count many unique (per session) user keys.
    var urls = [], dbObjs = [];
    for (var i = 0; i < Math.min(body.count, MAX_SIZE - count);) {
      var userkey = generateRandomBase32(TOKEN_LENGTH);
      var jiff_party_id = context.jiff.serverInstance.helpers.random(MAX_SIZE - 1) + 2; // in [2, MAX_SIZE]
      jiff_party_id = parseInt(jiff_party_id.toString(), 10); // in case of BigNumber objects

      // If user key already exists, repeat.
      if (userKeys[userkey] || jiffIds[jiff_party_id]) {
        continue;
      }

      // Mark as used
      userKeys[userkey] = true;
      jiffIds[jiff_party_id] = true;

      // Generate URL and add dbObject
      i++;
      urls.push('?session=' + body.session + '&participationCode=' + userkey);
      dbObjs.push({
        session: body.session,
        userkey: userkey,
        jiff_party_id: jiff_party_id
      });
    }

    // Save the userKeys into the db.
    var promise = modulesWrappers.UserKey.insertMany(dbObjs);
    promise.then(function () {
      console.log('URLs generated:', body.session, urls);
      response.json({ result: urls });
    }).catch(function (err) {
      console.log('Error in inserting client urls', err);
      response.status(500).send('Error during storing keys.');
    });
  }).catch(function (err) {
    console.log('Error getting client urls in createClientUrls', err);
    response.status(500).send('Error getting participation codes.');
  });
};
