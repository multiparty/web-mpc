// Dependencies
const jiffServer = require('../../jiff/lib/jiff-server.js');
const jiffServerBigNumber = require('../../jiff/lib/ext/jiff-server-bignumber.js');
const jiffServerRestAPI = require('../../jiff/lib/ext/jiff-server-restful.js');

const config = require('../config/config.js');
const mpc = require('../../client/app/helper/mpc.js');

const mailbox_hooks = require('./mailbox.js');
const authentication_hooks = require('./auth.js');

const MAX_SIZE = config.MAX_SIZE;

// Options and Hooks
const options = { logs: true, sodium: false, hooks: {} };
const computeOptions = {
  sodium: false,
  hooks: {
    createSecretShare: [function (jiff, share) {
      share.refresh = function () {
        return share;
      };
      return share;
    }]
  }
};
options.hooks = Object.assign(options.hooks, mailbox_hooks, authentication_hooks);

// In particular, load session keys and public keys, and use initializeSession below
// to initialize the sessions.
function JIFFWrapper(server, app) {
  this.serverInstance = jiffServer.make_jiff(server, options);
  // this.serverInstance.apply_extension(jiffServerBigNumber, options);
  this.serverInstance.apply_extension(jiffServerRestAPI, { app: app });
  this.serverInstance._wrapper = this;

  // Unsupported/insecure operations
  this.serverInstance.request_number_share = function () {
    throw new Error('Generating numbers using the server is not supported!');
  };
  this.serverInstance.request_triplet_share = function () {
    throw new Error('Generating beaver triplets using the server is not supported!');
  };

  // Load some volatile state from DB that may have been lost on shutdown/startup.
  this.ready = this.loadVolatile();
}

// Add volatile state management
require('./volatile')(JIFFWrapper);

// Initializing a JIFF computation when a session is created.
JIFFWrapper.prototype.initializeSession = async function (session_key, public_key, password) {
  this.tracker[session_key] = {};
  this.computed[session_key] = false;

  // Initialize
  var msg = { public_key: public_key, party_id: 1, party_count: MAX_SIZE, password: password };
  await this.serverInstance.initialize_party(session_key, 1, MAX_SIZE, msg);

  // Enable authentication hook
  this.computeSession(session_key);
};

// Setting up a listener for the session, to start computing when analyst requests.
JIFFWrapper.prototype.computeSession = function (session_key) {
  const self = this;
  const computationInstance = this.serverInstance.compute(session_key, computeOptions);
  computationInstance.listen('compute', function (sender_id, message) {
    if (sender_id !== 1 || self.hasBeenComputed(session_key)) {
      return;
    }

    self.trackComputed(session_key);

    console.log('Analyst requested to start opening computation', session_key, message);
    computationInstance.connect();
    var submitters = self.getTrackerParties(session_key);

    computationInstance.emit('compute', [ 1 ], JSON.stringify(submitters), false);
    var table_template = require('../../client/app/' + config.client.table_template + '.js');
    var ordering = mpc.consistentOrdering(table_template);
    mpc.compute(computationInstance, submitters, ordering);
  });
};

module.exports = JIFFWrapper;
