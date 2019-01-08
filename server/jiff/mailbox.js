module.exports = {
  put_in_mailbox: function (label, msg, computation_id, to_id) {
    // to_id: either 1 or s1
    // computation_id: same as session key
    // msg JSON string
    // label string: share / open / etc ..

  },
  get_mailbox : function (session_key, party_id) {
    // party_id: either 1 or s1
  },

  // Do not remove anything from the mailbox/db ever
  remove_from_mailbox: function () { },
  slice_mailbox: function () { }
};
