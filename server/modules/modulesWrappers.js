const Promise = require('bluebird');
const modules = require('./modules.js');

/**
 *  HISTORY MODULE
 */
// find history for a given session
var queryHistory = function (session_key, last_fetch) {
  return new Promise(function (resolve, reject) {
    var query = modules.History.where({session: session_key});
    if (last_fetch != null) {
      query = query.gt('date', last_fetch);
    }

    query = query.sort({ date: 'asc'});
    query.find(function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Count number of submissions and resubmissions per session
var countHistory = function (session_key) {
  return new Promise(function (resolve, reject) {
    var query = modules.History.where({session: session_key, success: true});
    // deprecated on newer versions of mongoose: use .countDocuments instead if mongoose is updated to version 5+
    query.count(function (err, count) {
      if (err) {
        reject(err);
      } else {
        resolve(count);
      }
    });
  });
};

// add to history of a given session
var insertHistory = function (session_key, jiff_party_id, success) {
  var history = new modules.History({
    session: session_key,
    jiff_party_id: jiff_party_id,
    date: Date.now(),
    success: success
  });

  return new Promise(function (resolve, reject) {
    history.save(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * SESSION INFO MODULE
 */
// insert new session
var insertSessionInfo = function (session_key, public_key, password, title, description) {
  var sessionInfo = new modules.SessionInfo({
    _id: session_key,
    session: session_key,
    pub_key: public_key,
    password: password,
    title: title,
    description: description,
    status: 'PAUSE'
  });

  return new Promise(function (resolve, reject) {
    sessionInfo.save(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// update existing session
var updateSessionInfo = function (sessionInfo) {
  return new Promise(function (resolve, reject) {
    sessionInfo.save(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// get all sessions
var allSessionInfo = function () {
  return new Promise(function (resolve, reject) {
    modules.SessionInfo.find({}, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// find session by session key and password
var getSessionInfo = function (session, password) {
  var obj = { _id: session };
  if (password != null) {
    obj['password'] = password;
  }

  return new Promise(function (resolve, reject) {
    modules.SessionInfo.findOne(obj, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * USER KEY MODULE
 */
// find user by session key and user key
var getUserKey = function (session_key, user_key) {
  return new Promise(function (resolve, reject) {
    modules.UserKey.findOne({_id: session_key + user_key}, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// find user keys by session key
var queryUserKey = function (session_key) {
  return new Promise(function (resolve, reject) {
    var query = modules.UserKey.where({ session: session_key});
    query.find(function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// insert several user keys
var insertManyUserKey = function (array) {
  array = array.map(function (obj) {
    obj['_id'] = obj.session + obj.userkey;
    return new modules.UserKey(obj);
  });

  return new Promise(function (resolve, reject) {
    modules.UserKey.insertMany(array, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * MAIL BOX MODULE
 */
// upsert (update or insert) into mailbox
var upsertMailbox = function (session_key, from_jiff_party_id, to_jiff_party_id, op_id, label, msg) {
  return new Promise(function (resolve, reject) {
    var id = session_key + ':' + from_jiff_party_id + ':' + to_jiff_party_id + ':' + op_id;

    var obj = new modules.Mailbox({
      _id: id,
      session: session_key,
      from_id: from_jiff_party_id.toString(),
      to_id: to_jiff_party_id.toString(),
      op_id: op_id,
      label: label,
      message: msg
    });

    modules.Mailbox.update({_id: id}, obj.toObject(), {upsert: true}, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// get entire mailbox for session key and user id
var queryMailbox = function (session_key, to_jiff_party_id) {
  var obj = { session: session_key, to_id: to_jiff_party_id };

  return new Promise(function (resolve, reject) {
    modules.Mailbox.where(obj).find(function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * CONVENTION:
 * 1. query yields a list (potentially empty).
 * 2. get yields a single object (potentially null).
 * 3. insert, upsert, and update resolve to nothing.
 * 4. insertMany inserts an array of objects and resolves to nothing.
 */
module.exports = {
  History: {
    query: queryHistory,
    insert: insertHistory,
    count: countHistory
  },
  SessionInfo: {
    get: getSessionInfo,
    insert: insertSessionInfo,
    update: updateSessionInfo,
    all: allSessionInfo
  },
  UserKey: {
    get: getUserKey,
    query: queryUserKey,
    insertMany: insertManyUserKey
  },
  Mailbox: {
    upsert: upsertMailbox,
    query: queryMailbox
  }
};
