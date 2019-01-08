/**
 * Route endpoints for analyst management API: creating sessions, managing client URLs, and managing session state.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

const base32Encode = require('base32-encode');
const crypto = require('crypto');

const TOKEN_LENGTH = 16;
function generateRandomBase32(length) {
  return base32Encode(crypto.randomBytes(length), 'Crockford').toString().toLowerCase()
}

// Mongo Modules
const modules = require('../modules/modules.js');

// Export route handlers
module.exports = {};


// endpoint for creating the session
module.exports.createSession = function (body, res) {
  var publickey = body.publickey;
  var sessionID = generateRandomBase32(TOKEN_LENGTH);
  var password = generateRandomBase32(TOKEN_LENGTH);

  var title = body.title.split('<').join('&lt;').split('>').join('&gt;');
  var description = body.description.split('<').join('&lt;').split('>').join('&gt;');

  var sessInfo = new modules.SessionInfo({
    _id: sessionID,
    session: sessionID,
    pub_key: publickey,
    password: password,
    title: title,
    description: description,
    status: 'PAUSE'
  });

  sessInfo.save(function (err) {
    if (err) {
      console.log(err);
      res.status(500).send('Error during session creation.');
    } else {
      console.log('Session generated for:', sessionID);
      res.json({ sessionID: sessionID, password: password });
    }
  });
};


// endpoint for getting the status of a session
module.exports.getStatus = function (body, res) {
  modules.SessionInfo.findOne({_id: body.session}, function (err, data) {
    if (err) {
      console.log(err);
      res.status(500).send('Error getting session status.');
      return;
    }

    var status = data ? data.status : 'PAUSE';
    res.send(status);
  });
};


// endpoint for setting session status
module.exports.setStatus = function (body, response, sessionInfoObj) {
  if (sessionInfoObj.status === 'STOP') {
    response.status(500).send('Session status is ' + sessionInfoObj.status);
    return;
  }

  // no need to verify status, joi already did it
  sessionInfoObj.status = body.status;
  sessionInfoObj.save(function (err) {
    if (err) {
      console.log(err);
      response.status(500).send('Error during session status update.');
    } else {
      console.log('Current Session Status:', body.status);
      response.json({result: body.status});
    }
  });
};


// endpoint for returning dates of submissions
module.exports.getSubmissionHistory = function (body, res) {
  modules.Aggregate.where({ session: body.session }).gt('date', body.last_fetch).find(function (err, data) {
    if (err) {
      console.log(err);
      res.status(500).send('Failed to fetch contributors.');
      return;
    }

    var to_send = [];
    for (var d of data) {
      to_send.push(d.date);
    }

    res.json({ result: to_send });
  });
};


// endpoint for returning previously created client urls
module.exports.getClientUrls = function (body, res) {
  // Password verified!
  modules.UserKey.where({ session: body.session }).find(function (err, data) {
    if (err) {
      console.log(err);
      res.status(500).send('Error getting participation codes.');
      return;
    }

    var urls = [];
    for (var d of data) {
      urls.push('?session=' + body.session + '&participationCode=' + d.userkey);
    }

    console.log('URLs fetched:', body.session);
    res.json({ result: urls });
  });
};


// endpoint for creating new client urls
module.exports.createClientUrls = function (body, response) {
  modules.UserKey.where({ session: body.session }).find(function (err, data) {
    if (err) {
      console.log(err);
      response.status(500).send('Error getting participation codes.');
      return;
    }

    var userKeys = {}; // fast lookup
    var count = 1; // starts at 1, because the first party is the analyst
    for (var d of data) {
      userKeys[d.userkey] = true;
      count++;
    }

    // Create count many unique (per session) user keys.
    var urls = [], dbObjs = [];
    for (var i = 0; i < body.count;) {
      var userkey = generateRandomBase32(TOKEN_LENGTH);

      // If user key already exists, repeat.
      if (userKeys[userKeys]) {
        continue;
      }

      // Generate URL and add dbObject
      i++;
      urls.push('?session=' + body.session + '&participationCode=' + userkey);
      dbObjs.push(new modules.UserKey({
        _id: body.session + userkey,
        session: body.session,
        userkey: userkey,
        party_id: count+i+1
      }));
    }

    console.log(urls);

    // Save the userKeys into the db.
    modules.UserKey.insertMany(dbObjs, function (err) {
      if (err) {
        console.log(err);
        response.status(500).send('Error during storing keys.');
      } else {
        console.log('URLs generated:', body.session);
        response.json({ result: urls });
      }
    });
  });
};
