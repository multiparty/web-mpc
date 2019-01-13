/**
 * Route endpoints for client: acquiring public key for a session, validating session and user keys, and submitting data.
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

const Promise = require('bluebird');

// Mongo Modules
const modules = require('../modules/modules.js');

// Export route handlers
module.exports = {};


// endpoint for fetching the public key for a specific session
module.exports.getPublicKey = function (context, body, response) {
  modules.SessionInfo.findOne({ session: body.session }, function (err, data) {
    if (err) {
      console.log(err);
      response.status(500).send('Error while fetching session.');
      return;
    }

    if (data) {
      response.send(data.pub_key);
    } else {
      response.status(500).send('Session is not found.');
    }
  });
};


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


// Helper that verifies the session status
function verifyStatus(sessionKey, expectedStatus, callback) {
  modules.SessionInfo.findOne( { _id: sessionKey }, function (err, data) {
    if (err) {
      callback(false, 'Error while verifying participation code.');
      return;
    }

    const actualStatus = data ? data.status : 'PAUSE';
    if (expectedStatus === actualStatus) {
      callback(true, data);
    } else {
      callback(false, 'Session status is ' + actualStatus);
    }
  });
}

// protocol for accepting new data
module.exports.submitData = function (context, body, response) {
  verifyStatus(body.session, 'START', function (status, msg) {
    if (!status) {
      console.log(msg);
      response.status(500).send(msg);
      return;
    }

    var mask = body.mask,
      req_data = body.data,
      pairwise_hypercubes = body.pairwise_hypercubes,
      session = body.session,
      user = body.user;

    var ID = session + user; // will use concat of user + session for now

    // save the mask and individual aggregate
    var aggToSave = new modules.Aggregate({
      _id: ID,
      fields: req_data,
      date: Date.now(),
      session: session,
      userkey: user
    });

    var maskToSave = new modules.Mask({
      _id: ID,
      fields: mask,
      session: session
    });

    // for both the aggregate and the mask, update the old aggregate
    // for the company with that userkey. Update or insert, hence the upsert flag
    var aggPromise = modules.Aggregate.update(
      { _id: ID },
      aggToSave.toObject(),
      { upsert: true }
    );
    var maskPromise = modules.Mask.update(
      { _id: ID },
      maskToSave.toObject(),
      { upsert: true }
    );

    Promise.join(aggPromise, maskPromise)
      .then(function () {
        response.send(body);
      }).catch(function (err) {
        console.log(err);
        response.status(500).send('Unable to save aggregate, please try again.');
      });
  });
};
