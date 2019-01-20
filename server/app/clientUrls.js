/**
 * Route endpoints for managing and retreiving user keys and associated urls.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

// DB Operation Wrappers
const modulesWrappers = require('../modules/modulesWrappers.js');
const config = require('../config/config.js');
const helpers = require('./helpers.js');

const MAX_SIZE = config.MAX_SIZE;

// Export route handlers
module.exports = {};

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
      var userkey = helpers.generateRandomBase32();

      var jiff_party_id = context.jiff.serverInstance.helpers.random(MAX_SIZE - 1);
      jiff_party_id = parseInt(jiff_party_id.toString(), 10) + 2; // in case of BigNumber objects

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
