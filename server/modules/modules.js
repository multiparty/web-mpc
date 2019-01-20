/**
 * Database modules
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

// Mongoose Model definitions
const HistoryModule = mongoose.model('History', new mongoose.Schema({
  // Keeps track of submission history
  session: String,
  jiff_party_id: Number,
  date: Number,
  success: Boolean
}));
const MailboxModule = mongoose.model('Mailbox', new mongoose.Schema({
  // Store messages/shares
  _id: String, // "session:from_id:to_id:op_id"
  session: String, // Session Key
  from_id: String, // Sender id
  to_id: String, // either 1 or s1
  op_id: String,
  label: String,
  message: String
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
  jiff_party_id: Number
}));

// Export modules
module.exports = {
  History: HistoryModule,
  Mailbox: MailboxModule,
  SessionInfo: SessionInfoModule,
  UserKey: UserKeyModule
};
