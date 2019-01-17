const modules = require('../modules/modules.js');
var Promise = require('bluebird');

module.exports = {
  put_in_mailbox: function (jiff, label, msg, computation_id, to_id) {
    // computation_id: same as session key
    // msg JSON string
    // label string: share / open / etc ..
    return new Promise(function (resolve, reject) {
      var tmp = JSON.parse(msg);
      if (label === 'public_keys') {
        tmp['party_id'] = 's1';
        tmp['op_id'] = 'public_keys';
      }

      var id = computation_id + ':' + tmp['party_id'] + ':' + to_id + ':' + tmp['op_id'];
      var obj = new modules.Mailbox({
        _id: id,
        session: computation_id,
        from_id: tmp['party_id'],
        to_id: to_id,
        op_id: tmp['op_id'],
        label: label,
        message: msg
      });

      var promise = modules.Mailbox.update(
        { _id: id },
        obj.toObject(),
        { upsert: true }
      );

      promise.then(resolve).catch(function () {
        reject('Unable to save aggregate, please try again.');
      });
    });
  },

  get_mailbox : function (jiff, computation_id, to_id) {
    // party_id: either 1 or s1
    return new Promise(function (resolve, reject) {
      modules.Mailbox.where({ to_id: to_id, session: computation_id }).find(function (err, data) {
        if (err) {
          console.log(err);
          reject('Error getting masks.');
          return;
        }

        if (!data || data.length === 0) {
          resolve([]);
          // TODO: move this to the mpc computation code: reject('No submissions yet. Please come back later.');
        } else {
          var result = [];
          for (var d of data) {
            result.push({ msg: d.message, label: d.label });
          }
          resolve(result);
        }
      });
    });
  },

  // Do not remove anything from the mailbox/db ever
  remove_from_mailbox: function () { },
  slice_mailbox: function () { }
};
