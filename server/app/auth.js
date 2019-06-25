/**
 * Authentication functions. Assigned to route in ../routes.js
 */
const modelWrappers = require('../models/modelWrappers.js');

// Session Key + Password Authentication
module.exports.password = function (body, callback) {
  var promise = modelWrappers.SessionInfo.get(body.session, body.password);
  promise.then(function (data) {
    if (data) {
      callback(true, data);
    } else {
      callback(false, 'Invalid session/password');
    }
  }).catch(function (err) {
    console.log('Error in password authentication', err);
    callback(false, 'Error while verifying password.');
  });
};

// Session Key + User Key Authentication
module.exports.userKey = function (body, callback) {
  var user_key = body.userkey ? body.userkey : body.user;
  var promise = modelWrappers.UserKey.get(body.session, user_key);
  promise.then(function (data) {
    if (data) {
      callback(true, data);
    } else {
      callback(false, 'Invalid session key or participation code key');
    }
  }).catch(function (err) {
    console.log('Error in user key authentication', err);
    callback(false, 'Error while fetching data.');
  });
};
