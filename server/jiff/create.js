const jiffServer = require('../../jiff/lib/jiff-server.js');
const jiffServerBigNumber = require('../../jiff/lib/ext/jiff-server-bignumber.js');

const options = { logs: false, sodium: false };

module.exports = function (server) {
  const mailbox_hooks = {
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

  // const serverInstance = jiffServer.make_jiff(server, options);
  // serverInstance.apply_extension(jiffServerBigNumber, options);
  // return serverInstance;
};
