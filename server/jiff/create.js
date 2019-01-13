const jiffServer = require('../../jiff/lib/jiff-server.js');
const jiffServerBigNumber = require('../../jiff/lib/ext/jiff-server-bignumber.js');
const jiffServerRestAPI = require('../../jiff/lib/ext/jiff-server-restful.js');

const options = { logs: true, sodium: false, hooks: {} };

function JIFFWrapper(server) {
  var mailbox_hooks = require('./mailbox.js');
  var authentication_hooks = require('./auth.js');

  options.hooks = Object.assign(options.hooks, mailbox_hooks, authentication_hooks);

  this.serverInstance = jiffServer.make_jiff(server, options);
  // this.serverInstance.apply_extension(jiffServerBigNumber, options);
  this.serverInstance.apply_extension(jiffServerRestAPI, options);
}
module.exports = JIFFWrapper;

// Initializing a JIFF computation when a session is created.
JIFFWrapper.prototype.initializeSession = function (session_key, public_key, max_party_count) {
  // Disable authentication hook
  var oldHooks = this.serverInstance.beforeInitialization;
  this.serverInstance.beforeInitialization = [];

  // Initialize
  this.serverInstance.initialize_party(session_key, 1, max_party_count, { public_key: public_key });

  // Enable authentication hook
  this.serverInstance.beforeInitialization = oldHooks;
};
