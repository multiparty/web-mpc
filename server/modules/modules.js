/**
 * Database modules.
 */

'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

// Override deprecated promise
mongoose.Promise = Promise;

(async function () {
  try {
    await mongoose.connect('mongodb://localhost/aggregate', { useMongoClient: true });
  } catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
  }
}());

// model for aggregate data
const AggregateModule = mongoose.model('Aggregate', new mongoose.Schema({
  _id: String, // concat of session + userkey.
  fields: Object,
  date: Number,
  session: String,
  userkey: String
}));
const MaskModule = mongoose.model('Mask', new mongoose.Schema({
  _id: String, // concat of session + user.
  fields: Object,
  // questions_public: Object,
  session: String
}));
const SessionInfoModule = mongoose.model('SessionInfo', new mongoose.Schema({
  _id: String,
  session: String,
  pub_key: String,
  password: String,
  title: String,
  description: String,
  status: String
}));
const UserKeyModule = mongoose.model('UserKey', new mongoose.Schema({
  _id: String, // concat of session + userkey.
  session: String,
  userkey: String,
  party_id: Number
}));


// Export modules
module.exports = {
  Aggregate: AggregateModule,
  Mask: MaskModule,
  SessionInfo: SessionInfoModule,
  UserKey: UserKeyModule
};

