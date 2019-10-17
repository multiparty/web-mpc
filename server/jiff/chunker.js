const modulesWrappers = require('../models/modelWrappers');

// number of parties in a chunk
const partiesPerBatch = 4;

function Chunker(computation_id) {
  this.computation_id = computation_id;
}

// initialize
Chunker.prototype.init = async function (jiff) {
  // submitters
  this.submitters = await jiff._wrapper.getTrackerParties(this.computation_id);

  // linearize order of parties in an order matching the computation order
  this.parties = this.submitters['none'].slice();
  for (var cohort of this.submitters['cohorts']) {
    this.parties = this.parties.concat(this.submitters[cohort]);
  }
  this.parties.push('s1');

  // index into parties array
  this.index = 0;
  this.serverSlice = 2; // number of messages to slice from server
  this.lastServerBatchSize = 0;
};

// get 'public_keys' and 'custom' messages!
Chunker.prototype.initMessages = async function () {
  return await modulesWrappers.Mailbox.query(this.computation_id, 1, 0, 2, { from_id: 's1' });
};

// chunk: create a chunk of messages and return it
Chunker.prototype.chunk = async function () {
  // in case done
  if (this.index >= this.parties.length) {
    return [];
  }

  // not done yet!
  var messages = [];
  if (this.index === this.parties.length - 1) { // keep all messages from 's1' in one chunk!
    messages = await modulesWrappers.Mailbox.query(this.computation_id, 1, this.serverSlice, null, { from_id: 's1' });
    this.lastServerBatchSize = messages.length;
  } else {
    var count = Math.min(this.parties.length - 1, this.index + partiesPerBatch);
    for (var i = this.index; i < count; i++) {
      var party_id = this.parties[i];

      var data = await modulesWrappers.Mailbox.query(this.computation_id, 1, null, null, { from_id: party_id });
      messages = messages.concat(data);
    }
  }

  if (this.index === 0) {
    messages = (await this.initMessages()).concat(messages);
  }
  return messages;
};

// Slice: move marker up so that the next call to chunk returns the next chunk
Chunker.prototype.slice = function () {
  if (this.index >= this.parties.length - 1) {
    this.index = this.parties.length - 1;
    this.serverSlice += this.lastServerBatchSize;
    this.lastServerBatchSize = 0;
  } else {
    this.index = Math.min(this.index + partiesPerBatch, this.parties.length - 1);
  }
};

module.exports = Chunker;
