/**
 * Route endpoints for analyst aggregation API
 * The endpoints are executed AFTER payload validation and authentication are successful.
 */

// Mongo Modules
const modules = require('../modules/modules.js');
const mpc = require('../../client/app/helper/mpc');

// Export route handlers
module.exports = {};


// endpoint for getting all of the masks for a specific session
module.exports.getMasks = function (context, body, response, sessionInfoObj) {
  if (sessionInfoObj.status !== 'STOP') {
    response.status(500).send('Session status is ' + sessionInfoObj.status);
    return;
  }

  modules.Mask.where({ session: body.session }).find(function (err, data) {
    if (err) {
      console.log(err);
      response.status(500).send('Error getting masks.');
      return;
    }

    if (!data || data.length === 0) {
      response.status(500).send('No submissions yet. Please come back later.');
    } else {
      response.send({ data: JSON.stringify(data) });
    }
  });
};

// endpoint for getting the service share of the result of the aggregation
module.exports.getAggregate = function (context, body, response, sessionInfoObj) {
  if (sessionInfoObj.status !== 'STOP') {
    response.status(500).send('Session status is ' + sessionInfoObj.status);
    return;
  }

  modules.Aggregate.where({ session: body.session }).find(function (err, data) {
    if (err) {
      console.log(err);
      response.status(500).send('Error computing aggregate.');
      return;
    }

    // make sure query result is not empty
    if (!data || data.length === 0) {
      response.status(500).send('No submissions yet. Please come back later.');
    } else {
      console.log('Computing share of aggregate.');

      var invalidShareCount = mpc.countInvalidShares(data, true),
        serviceShare = mpc.aggregateShares(data, true);

      // TODO: we should set a threshold and abort if there are too
      // many invalid shares
      console.log('Invalid share count:', invalidShareCount);

      console.log('Sending aggregate.');
      response.json(serviceShare);
    }
  });
};
