const jiffServer = require('../../jiff/lib/jiff-server.js');
const jiffServerBigNumber = require('../../jiff/lib/ext/jiff-server-bignumber.js');
const jiffServerRestAPI = require('../../jiff/lib/ext/jiff-server-restful.js');

const options = { logs: false, sodium: false, hooks: {} };

module.exports = function (server) {
  // var mailbox_hooks = require('./mailbox.js');
  var mailbox_hooks = {};
  var authentication_hooks = require('./auth.js');

  options.hooks = Object.assign(options.hooks, mailbox_hooks, authentication_hooks);

  const serverInstance = jiffServer.make_jiff(server, options);
  // serverInstance.apply_extension(jiffServerBigNumber, options);
  serverInstance.apply_extension(jiffServerRestAPI, options);
  return serverInstance;
};
