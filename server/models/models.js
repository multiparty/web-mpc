/**
 * Database Models
 */

'use strict';

const mongoose = require('mongoose');

const mongohost = process.env.MONGOHOST|| 'mongodb://localhost:27017';
(async function () {
  try {
    await mongoose.connect(mongohost+'/aggregate', { useMongoClient: true });
    console.log('You are connected to ',mongohost);
  } catch (err) {
    console.log('Could not connect to MongoDB server', err);
  }
}());

const cohortMappingSchema = new mongoose.Schema({
  name: String,
  id: Number
});

// Mongoose Model definitions
const HistoryModel = mongoose.model('History', new mongoose.Schema({
  // Keeps track of submission history
  session: String,
  jiff_party_id: Number,
  participant_id: String,
  date: Number,
  success: Boolean
}));

const MailboxModel = mongoose.model('Mailbox', new mongoose.Schema({
  // Store messages/shares
  _id: String, // "session:from_id:to_id:op_id"
  session: String, // Session Key
  from_id: String, // Sender id
  to_id: String, // either 1 or s1
  op_id: String,
  label: String,
  message: String
}));

const SessionInfoModel = mongoose.model('SessionInfo', new mongoose.Schema({
  _id: String,
  session: String,
  pub_key: String,
  password: String,
  title: String,
  description: String,
  status: String,
  cohorts: Number,
  cohort_mapping: [cohortMappingSchema]
},
  {
    usePushEach: true
  }));
  
const UserKeyModel = mongoose.model('UserKey', new mongoose.Schema({
  _id: String, // concat of session + userkey.
  session: String,
  userkey: String,
  jiff_party_id: Number,
  cohort: Number,
}));

// Export models
module.exports = {
  History: HistoryModel,
  Mailbox: MailboxModel,
  SessionInfo: SessionInfoModel,
  UserKey: UserKeyModel
};
