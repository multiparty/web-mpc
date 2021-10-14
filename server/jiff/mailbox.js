const modulesWrappers = require('../models/modelWrappers');
const Chunker = require('./chunker.js');

// manages chunking big mailbox of analyst into consistent and ordered chunks
const chunkers = {};

module.exports = {
  putInMailbox: function (jiff, label, msg, computation_id, to_id) {
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

  getFromMailbox : async function (jiff, computation_id, to_id) {
    try {
      var data;
      if (to_id !== 1) {
        // not the analyst, get all messages with no special filtering or ordering
        data = await modulesWrappers.Mailbox.query(computation_id, to_id);
      } else {
        data = await chunkers[computation_id].chunk();
      }

      var result = [];
      for (var d of data) {
        result.push({msg: d.message, label: d.label});
      }
      return result;
    } catch (err) {
      console.log('Error in getting mailbox', err);
      throw new Error('Error getting masks');
    }
  },

  // Logical slicing (without actual removing)
  sliceMailbox: function (jiff, computation_id, party_id, length) {
    if (party_id === 1) {
      if (chunkers[computation_id]) {
        chunkers[computation_id].slice();
      }
    }
  },
  // undo slicing
  reset_counter: async function (jiff, computation_id) {
    chunkers[computation_id] = new Chunker(computation_id);
    await chunkers[computation_id].init(jiff);
  },

  // Do not remove anything from the mailbox/db ever
  removeFromMailbox: function () { }
};
