const modulesWrappers = require('../modules/modulesWrappers.js');
var Promise = require('bluebird');

module.exports = {
  put_in_mailbox: function (jiff, label, msg, computation_id, to_id) {
    // computation_id: same as session key
    // msg JSON string
    // label string: share / open / etc ..
    var tmp = JSON.parse(msg);
    if (label === 'public_keys') {
      tmp['party_id'] = 's1';
      tmp['op_id'] = 'public_keys';
    }

    var promise = modulesWrappers.Mailbox.upsert(computation_id, tmp['party_id'], to_id, tmp['op_id'], label, msg);
    return promise.catch(function (err) {
      console.log('Error in putting in mailbox', err);
      throw new Error('Unable to save aggregate, please try again.');
    });
  },

  get_mailbox : function (jiff, computation_id, to_id) {
    // party_id: either 1 or s1
    var promise = modulesWrappers.Mailbox.query(computation_id, to_id);

    return promise.then(function (data) {
      var result = [];
      for (var d of data) {
        result.push({ msg: d.message, label: d.label });
      }
      return result;
    }).catch(function (err) {
      console.log('Error in getting mailbox', err);
      throw new Error('Error getting masks');
    });
  },

  // Do not remove anything from the mailbox/db ever
  remove_from_mailbox: function () { },
  slice_mailbox: function () { }
};
