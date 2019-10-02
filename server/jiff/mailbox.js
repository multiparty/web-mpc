const modulesWrappers = require('../models/modelWrappers');

const startIndex = {};
const maxBatchSize = 1306 * 10; // 10 parties at a time

module.exports = {
  maxBatchSize: maxBatchSize,
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
    var skip, limit;
    if (to_id === 1) {
      skip = startIndex[computation_id];
      limit = maxBatchSize + (skip && skip > 0 ? 0 : 1); // first ever request should get 1 extra message (public keys)
    }

    var promise = modulesWrappers.Mailbox.query(computation_id, to_id, skip, limit);
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

  // Logical slicing (without actual removing)
  slice_mailbox: function (jiff, computation_id, party_id, length) {
    startIndex[computation_id] = startIndex[computation_id] || 0;
    startIndex[computation_id] += length;
  },
  // undo slicing
  reset_counter: function (jiff, computation_id) {
    startIndex[computation_id] = 0;
  },

  // Do not remove anything from the mailbox/db ever
  remove_from_mailbox: function () { }
};
