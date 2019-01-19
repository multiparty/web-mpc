const jiffServer = require('../../jiff/lib/jiff-server.js');
const jiffServerBigNumber = require('../../jiff/lib/ext/jiff-server-bignumber.js');
const jiffServerRestAPI = require('../../jiff/lib/ext/jiff-server-restful.js');

const config = require('../config/config.js');
const mpc = require('../../client/app/helper/mpc.js');

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

var mailbox_hooks = require('./mailbox.js');
var authentication_hooks = require('./auth.js');
options.hooks = Object.assign(options.hooks, mailbox_hooks, authentication_hooks);

// TODO: do not forget to load configurations from DB on create.
// In particular, load session keys and public keys, and use initializeSession below
// to initialize the sessions.
function JIFFWrapper(server, app) {
  this.serverInstance = jiffServer.make_jiff(server, options);
  // this.serverInstance.apply_extension(jiffServerBigNumber, options);
  this.serverInstance.apply_extension(jiffServerRestAPI, { app: app });
  this.serverInstance._wrapper = this;

  // Track jiff_party_ids of submitters
  // This is stored in volatile memory but must be persistent
  // TODO: read/compute these from DB on create + initialize_session.
  this.tracker = {};
  this.computed = {};
}
module.exports = JIFFWrapper;

// Load previously created sessions from DB into memory
JIFFWrapper.prototype.loadSessions = async function () {
  // We have three pieces of volatile information that we need to load
  // 1. jiff session information (compute using initializeSession)
  // 2. tracker to keep track of submitters and associated public keys in serverInstance.key_map
  // 3. computed to keep track of which session have been computed.

};

// Initializing a JIFF computation when a session is created.
JIFFWrapper.prototype.initializeSession = async function (session_key, public_key, password, max_party_count) {
  this.tracker[session_key] = {};
  this.computed[session_key] = false;

  // Initialize
  await this.serverInstance.initialize_party(session_key, 1, max_party_count, { public_key: public_key, party_id: 1, party_count: max_party_count, password: password });
  this.serverInstance.key_map['0a9qc6zkmv344kzx0a434mhbvc'] = { 3222: '', 4817: '' };

  // Enable authentication hook
  this.computeSession(session_key);
};

// Keeps track of submitters IDs
JIFFWrapper.prototype.trackParty = function (session_key, jiff_party_id, status) {
  if (jiff_party_id === 's1' || jiff_party_id === 1) {
    return;
  }

  this.tracker[session_key][jiff_party_id] = status;
};
JIFFWrapper.prototype.getTrackerParties = function (session_key) {
  var tracked = [];
  for (var key in this.tracker[session_key]) {
    if (this.tracker[session_key].hasOwnProperty((key)) && this.tracker[session_key][key] === true) {
      tracked.push(key);
    }
  }

  tracked.sort();
  return tracked;
};

// Keeps track of computations that has been computed: no need to recompute these,
// can just replay messages from database.
JIFFWrapper.prototype.trackComputed = function (session_key) {
  this.computed[session_key] = true;
};
JIFFWrapper.prototype.hasBeenComputed = function (session_key) {
  return this.computed[session_key] === true;
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
