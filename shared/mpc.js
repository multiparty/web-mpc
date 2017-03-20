/***************************************************************
 *
 * mpc.js
 *
 * Shared module for MPC functionality.
 *
 */

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
 * @param n
 */
function _secretShare (value, n) {
  if (value >= MAX_VALUE) {
    throw new Error('Input value too large');
  }
  if (value < 0) {
    throw new Error('Input value negative');  
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
      var value = obj[key],
          shares = _secretShare(value, 2);
      serviceTuples[key] = shares[0];
      analystTuples[key] = shares[1];
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
 * @param includeCounts
 * @param db
 */
function aggregateShares (data, includeCounts, db) {

  // By default, this is not for the database calculation.
  if (db == null) {
    db = false;
  }
  
  // Access fields in JSON object or in DB object.
  var fields = db ? function(x){return x.fields;} : function(x){return x;};
  var convert = db ? function(x){return x;} : parseInt;

  // Ensure we are always working with an array.
  if (db) {
    var arr = [];
    for (row in data)
        arr.push(data[row]);
    data = arr;
  }

  // Compute the aggregate.
  var agg = {};
  for (var key in fields(data[0])) {
    agg[key] = 0;
  }
  for (var i = 0; i < data.length; i++) {
    for (let key in agg) {
      agg[key] = _addShares(agg[key], convert(fields(data[i])[key]));
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

if (typeof module !== 'undefined') {
  module.exports = {
    'FIELD': FIELD,
    'aggregateShares': aggregateShares
  };
}
