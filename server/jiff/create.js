const jiffServer = require('../../jiff/lib/jiff-server.js');
const jiffServerBigNumber = require('../../jiff/lib/ext/jiff-server-bignumber.js');
const jiffServerRestAPI = require('../../jiff/lib/ext/jiff-server-restful.js');

const options = { logs: true, sodium: false, hooks: {} };
const computeOptions = { sodium: false }; // Can include things like Zp and crypto hooks

var mailbox_hooks = require('./mailbox.js');
var authentication_hooks = require('./auth.js');
var submission_hooks = require('./submission.js');
options.hooks = Object.assign(options.hooks, mailbox_hooks, authentication_hooks, submission_hooks);

// TODO: do not forget to load configurations from DB on create.
// In particular, load session keys and public keys, and use initializeSession below
// to initialize the sessions.
function JIFFWrapper(server, app) {
  this.serverInstance = jiffServer.make_jiff(server, options);
  // this.serverInstance.apply_extension(jiffServerBigNumber, options);
  this.serverInstance.apply_extension(jiffServerRestAPI, { app: app });

  // Track jiff_party_ids of submitters
  // This is stored in volatile memory but must be persistent
  // TODO: read/compute these from DB on create + initialize_session.
  this.tracker = {};
  this.computed = {};
}
module.exports = JIFFWrapper;

// Initializing a JIFF computation when a session is created.
JIFFWrapper.prototype.initializeSession = async function (session_key, public_key, max_party_count) {
  // Disable authentication hook
  var oldHooks = this.serverInstance.hooks.beforeInitialization;
  this.serverInstance.hooks.beforeInitialization = [];

  // Initialize
  await this.serverInstance.initialize_party(session_key, 1, max_party_count, { public_key: public_key, party_id: 1, party_count: max_party_count });

  // Enable authentication hook
  this.serverInstance.hooks.beforeInitialization = oldHooks;
  this.computeSession(session_key);
};

// Keeps track of submitters IDs
JIFFWrapper.prototype.trackParty = function (jiff_party_id) {
  this.tracker[jiff_party_id] = true;
};
JIFFWrapper.prototype.getTrackerParties = function () {
  var tracked = [];
  for (var key in this.tracker) {
    if (this.tracker.hasOwnProperty((key)) && this.tracker[key] === true) {
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

    console.log('Analyst requested to start opening computation', session_key, message);
    self.trackComputed(session_key);
  });
};
