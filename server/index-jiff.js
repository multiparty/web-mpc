

module.exports = function (http) {
  var jiffServer = require('../jiff/lib/jiff-server.js');
  var jiffServerBigNumber = require('../jiff/lib/ext/jiff-server-bignumber.js');

  var options = { logs: true, sodium: false };

  var mailbox_hooks = {
    put_in_mailbox: function (label, msg, session_key, to_id) {
      // to_id: either 1 or s1

    },
    get_mailbox : function (session_key, party_id) {
      // party_id: either 1 or s1
    },
    remove_from_mailbox: function () { },
    slice_mailbox: function () { }
  };

  options.hooks = Object.assign({}, mailbox_hooks);

  var serverInstance = jiffServer.make_jiff(http, options);
  serverInstance.apply_extension(jiffServerBigNumber, options);
  console.log('success jiff');
  return serverInstance;
};
