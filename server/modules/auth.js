/**
 * Authentication functions. Assigned to route in ../routes.js
 */
const modules = require('./modules.js');

// Session Key + Password Authentication
module.exports.password = function (body, callback) {
  modules.SessionInfo.findOne({ _id: body.session, password: body.password }, function (err, data) {
    if (err) {
      callback(false, 'Error while verifying password.');
    } else if (data) {
      callback(true, data);
    } else {
      callback(false, 'Invalid session/password');
    }
  });
};

// Session Key + User Key Authentication
module.exports.userKey = function (body, callback) {
  var userkey = body.userkey ? body.userkey : body.user;
  modules.UserKey.findOne({ _id: body.session + userkey }, function (err, data) {
    if (err) {
      callback(false, 'Error while fetching data.');
    } else if (data) {
      callback(true, data);
    } else {
      callback(false, 'Invalid session key or participation code key');
    }
  });
};
