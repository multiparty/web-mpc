/***************************************************************
 *
 * mpc.js
 *
 * Shared module for MPC functionality.
 *
 */

'use strict';

var MAX_VALUE = 4294967296; // 2^32

/**
 *
 * @param value
 */
function _uint32 (value) {
  return value >>> 0;
}

/**
 *
 * @param value
 */
function _inUint32Range (value) {
  return (0 <= value) && (value < MAX_VALUE);
}

/**
 *
 * @param value
 * @param n
 */
function _secretShare (value, n) {
  if (!_inUint32Range(value)) {
    throw new Error('Input value outside valid range');
  }
  var uvalue = _uint32(value),
      shares = new Uint32Array(n),
      cryptoObj = window.crypto || window.msCrypto; // IE 11 fix
  
  cryptoObj.getRandomValues(shares);
  
  shares[n - 1] = _uint32(0);
  var sumRandomShares = shares.reduce(function (e1, e2) {
    return _uint32(e1 + e2);
  });
  shares[n - 1] = _uint32(uvalue - sumRandomShares);
  return shares;
}

/**
 *
 * @param share1
 * @param share2
 */
function _addShares (share1, share2) {
  return _uint32(share1 + share2);
}

/**
 *
 * @param shares
 */
function _recombine (shares) {
  return shares.reduce(function (e1, e2) {
    return _uint32(e1 + e2); 
  });
}

/**
 *
 * @param obj
 */
function secretShareValues (obj) {
  var serviceTuples = {},
      analystTuples = {};

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var value = obj[key];
      if(typeof(value) == "number") {
        var shares = _secretShare(value, 2);
        
        serviceTuples[key] = shares[0];
        analystTuples[key] = shares[1];
      }
      
      else {
        // value is a nested object.
        var tmp = secretShareValues (value);
        serviceTuples[key] = tmp['service'];
        analystTuples[key] = tmp['analyst'];
      }
    }
  }

  return {
    'service': serviceTuples,
    'analyst': analystTuples
  };
}

/**
 *
 * @param data
 * @param db
 */
function countInvalidShares (data, db) {
  // By default, this is not for the database calculation.
  if (db == null) {
    db = false;
  }
  
  // Access fields in JSON object or in DB object.
  var fields = db ? function(x){return x.fields;} : function(x){return x;};
  var isInvalid;
  if (db) {
    isInvalid = function (x) {
      return (!_inUint32Range(x) ? 1 : 0);
    };
  }
  else {
    isInvalid = function (x) {
      var result = parseInt(x, 10),
          invalid = 0;
      if (isNaN(result) || !_inUint32Range(result)) {
        invalid = 1;
      }
      return invalid;
    };
  }

  // Ensure we are always working with an array.
  if (db) {
    var arr = [];
    for (let row in data) {
      arr.push(data[row]);
    }
    data = arr;
  }

  // Compute the aggregate.
  var invalidCount = {};
  for (var key in fields(data[0])) {
    invalidCount[key] = 0;
  }
  for (var i = 0; i < data.length; i++) {
    for (let key in invalidCount) {
      var count = isInvalid(fields(data[i])[key]);
      invalidCount[key] = invalidCount[key] + count;
    }
  }

  return invalidCount;
}

/**
 *
 * @param data
 * @param db
 */
function aggregateShares (data, db) {

  // By default, this is not for the database calculation.
  if (db == null) {
    db = false;
  }
  
  // Access fields in JSON object or in DB object.
  var fields = db ? function(x){return x.fields;} : function(x){return x;};
  var convert = db ? function(x){return _uint32(x);} : function (x) {
    var result = parseInt(x, 10);
    if (isNaN(result)) {
      console.error('NaN detected in:', x, data);
      result = 0;
    }
    else if (!_inUint32Range(result)) {
      console.error('Outside range detected in:', x, data);
      result = 0;
    }
    return _uint32(result);
  };

  // Ensure we are always working with an array.
  if (db) {
    var arr = [];
    for (let row in data) {
      arr.push(data[row]);
    }
    data = arr;
  }

  // Compute the aggregate.
  var agg = {};
  for (var key in fields(data[0])) {
    agg[key] = _uint32(0);
  }
  for (var i = 0; i < data.length; i++) {
    for (let key in agg) {
      var value = convert(fields(data[i])[key]);
      agg[key] = _addShares(agg[key], value);
    }
  }

  return agg;
}

/**
 *
 * @param serviceTuples
 * @param analystTuples
 */
function recombineValues (serviceTuples, analystTuples) {
  var res = {};
  for (var field in serviceTuples) {
    if (serviceTuples.hasOwnProperty(field)) {
      res[field] = _recombine([serviceTuples[field], analystTuples[field]]);                      
    }
  }
  return res;
}

function encryptWithKey (obj, key) {
  var pki = forge.pki;
  var publicKey = pki.publicKeyFromPem(key);
  
  return _encryptWithKey(obj, publicKey);
}
  
function _encryptWithKey (obj, publicKey) {
  var encrypted = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var value = obj[key];
      if(typeof(value) == "number")
        encrypted[key] = publicKey.encrypt(value.toString(), 'RSA-OAEP', { md: forge.md.sha256.create() });
      
      else 
        encrypted[key] = _encryptWithKey(value, key);
    }
  }
  
  return encrypted;
}

if (typeof module !== 'undefined') {
  module.exports = {
    'aggregateShares': aggregateShares,
    'countInvalidShares': countInvalidShares
  };
}
