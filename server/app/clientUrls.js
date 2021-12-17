/**
 * Route endpoints for managing and retreiving user keys and associated urls.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

// DB Operation Wrappers
const modelWrappers = require('../models/modelWrappers.js');
const config = require('../config/config.js');
const helpers = require('./helpers.js');
const table_template = require('../../client/app/' + config.client.table_template + '.js');

const MAX_SIZE = config.MAX_SIZE;

// Export route handlers
module.exports = {};

// end point for setting the number of cohorts in a session
module.exports.createNewCohort = function (context, body, response, sessionInfoObj) {
  // Password verified already by authentication!
  if (sessionInfoObj.status !== 'PAUSE') {
    response.status(500).send('Session status is ' + sessionInfoObj.status);
    return;
  }
  const oldCohortNum = sessionInfoObj.cohort_mapping.length;
  const cohortMapping = sessionInfoObj.cohort_mapping;

  const validateNames = module.exports.checkCohortNames(body.cohorts, cohortMapping);
  if (!validateNames.valid) {
    response.status(500).send(`Cohort "${validateNames.name}" already exists.`);
    return;
  }

  const cohortNames = module.exports.createDefaultCohortNames(body.cohorts, cohortMapping);
  const cohortNum = cohortMapping.length + cohortNames.length;
  // Do not need to verify since joi already did it
  for (let i = 0; i < cohortNames.length; i++) {
    sessionInfoObj.cohort_mapping.push({id: oldCohortNum+i+1, name: cohortNames[i]});
  }
  sessionInfoObj.cohorts = cohortNum;

  // Update sessionInfo in database
  var promise = modelWrappers.SessionInfo.update(sessionInfoObj);
  promise.then(function () {
    console.log('Updated cohorts:', body.session, sessionInfoObj.cohorts);
    response.json({oldCohortId: oldCohortNum, cohortId: cohortNum, cohortMapping: sessionInfoObj.cohort_mapping});
  }).catch(function (err) {
    console.log('Error creating new cohort', err);
    response.status(500).send('Error during session cohorts update.');
  });
};

module.exports.checkCohortNames = function (cohortNames, cohortMapping) {
  for (let name of cohortNames) {
    for (var c of cohortMapping) {
      if (name != null && c.name === name) {
        return {valid: false, name: name};
      }
    }
  }
  return {valid: true, name: ''}
};

module.exports.createDefaultCohortNames = function (cohortNames, cohortMapping) {
  const currentLen = cohortMapping.length;
  const newNames = [];
  for (let i = 0; i < cohortNames.length; i++) {
    if (cohortNames[i] == null) {
      newNames.push(`${config.client.cohort} ${i+1+currentLen}`); // i.e. "Cohort 1" or "Industry 1"
    } else {
      newNames.push(cohortNames[i]);
    }
  }
  return newNames;
};


// Need to get cohorts from multiple locations
module.exports.getCohorts = function (context, body, res) {
  var promise = modelWrappers.SessionInfo.get(body.session);

  promise.then(function (data) {
    res.json({cohorts: data.cohort_mapping});

  }).catch(function (err) {
    console.log('Error getting cohorts', err);
    res.status(500).send('Error getting cohorts.');
  });
};

// Need to get cohorts from multiple locations
module.exports.getUser = function (context, body, res) {
  var promise = modelWrappers.UserKey.get(body.session, body.userkey);

  promise.then(function (data) {
    res.json({session: data.session, userkey: data.userkey, cohort: data.cohort});

  }).catch(function (err) {
    console.log('Error getting user', err);
    res.status(500).send('Error getting user.');
  });
};

// endpoint for returning previously created client urls
module.exports.getClientUrls = function (context, body, res) {
  // Password verified already by authentication!
  var promise = modelWrappers.UserKey.query(body.session);

  promise.then(function (data) {
    var urls = {};
    for (var d of data) {
      var cohort = table_template.cohort_selection === true ? 0 : d.cohort;
      var arr = urls[cohort] == null ? [] : urls[cohort];
      arr.push('?session=' + body.session + '&participationCode=' + d.userkey);
      urls[cohort] = arr;
    }

    console.log('URLs fetched:', body.session);
    res.json({ result: urls });
  }).catch(function (err) {
    console.log('Error in getting client urls', err);
    res.status(500).send('Error getting participation codes.')
  });
};

// endpoint for creating new client urls
module.exports.createClientUrls = function (context, body, response, sessionInfoObj) {
  var cohortId = body.cohort;

  var promise = modelWrappers.UserKey.query(body.session);
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
      jiff_party_id = parseInt(jiff_party_id.toString(), 10) + 2;  // in case of BigNumber objects

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
        jiff_party_id: jiff_party_id,
        cohort: cohortId
      });
    }

    // Save the userKeys into the db.
    var promise = modelWrappers.UserKey.insertMany(dbObjs);
    promise.then(function () {
      console.log('URLs generated:', body.session, urls);
      response.json({ result: urls, cohort: cohortId });
    }).catch(function (err) {
      console.log('Error in inserting client urls', err);
      response.status(500).send('Error during storing keys.');
    });
  }).catch(function (err) {
    console.log('Error getting client urls in createClientUrls', err);
    response.status(500).send('Error getting participation codes.');
  });
};
