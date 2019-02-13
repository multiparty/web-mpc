// Dependencies
const jiffServer = require('../../jiff/lib/jiff-server.js');
const jiffServerBigNumber = require('../../jiff/lib/ext/jiff-server-bignumber.js');
const jiffServerRestAPI = require('../../jiff/lib/ext/jiff-server-restful.js');
const moduleWrappers = require('../modules/modulesWrappers.js');

const config = require('../config/config.js');
const mpc = require('../../client/app/helper/mpc.js');

const mailbox_hooks = require('./mailbox.js');
const authentication_hooks = require('./auth.js');

const MAX_SIZE = config.MAX_SIZE;

// Crypto hooks
const cryptoHooks =  {
  generateKeyPair: function () {
    return { public_key: 's1', secret_key: 's1' };
  },
  parseKey: function (jiff, key) {
    return key;
  },
  dumpKey: function (jiff, key) {
    return key;
  }
};

// Options and Hooks
const options = { logs: true, sodium: false, hooks: {} };
const computeOptions = {
  sodium: false,
  Zp: '618970019642690137449562111',  // 2^89-1
  hooks: {
    createSecretShare: [function (jiff, share) {
      share.refresh = function () {
        return share;
      };
      return share;
    }]
  }
};
options.hooks = Object.assign(options.hooks, mailbox_hooks, authentication_hooks, cryptoHooks);

// In particular, load session keys and public keys, and use initializeSession below
// to initialize the sessions.
function JIFFWrapper(server, app) {
  this.serverInstance = jiffServer.make_jiff(server, options);
  this.serverInstance.apply_extension(jiffServerBigNumber);
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

  // Initialize
  var msg = { public_key: public_key, party_id: 1, party_count: MAX_SIZE, password: password };
  await this.serverInstance.initialize_party(session_key, 1, MAX_SIZE, msg);
};

// Setting up a listener for the session, to start computing when analyst requests.
JIFFWrapper.prototype.computeSession = function (session_key) {
  console.log('Perform server side computation', session_key);

  var copy = Object.assign({}, computeOptions);
  copy.hooks = Object.assign({}, computeOptions.hooks, cryptoHooks);
  const computationInstance = this.serverInstance.compute(session_key, computeOptions);
  computationInstance.connect();

  // Send submitters ids to analyst
  var submitters = this.getTrackerParties(session_key);
  var resubmission_avg = moduleWrappers.History.resubmission(session_key);
  computationInstance.emit('compute', [ 1 ], JSON.stringify({submitters, resubmission_avg}), false);

  // Perform server-side MPC
  var table_template = require('../../client/app/' + config.client.table_template + '.js');
  var ordering = mpc.consistentOrdering(table_template);
  mpc.compute(computationInstance, submitters, ordering);
};

module.exports = JIFFWrapper;
