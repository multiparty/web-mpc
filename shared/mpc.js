/***************************************************************
 *
 * mpc.js
 *
 * Shared module for MPC functionality.
 *
 */

/* This is the modulus we will use */
var FIELD = 4294967296; // 2^32

/**
 *
 * @param value
 * @param modulus
 */
function _mod (value, modulus) {
  // Note: % is the remainder op NOT the mod op
  return (((value) % modulus) + modulus) % modulus;
}

/**
 *
 * @param value
 * @param n
 * @param field
 */
function _secretShare (value, n, field) {
  // TODO: double-check if there could be overflow
  // TODO: raise error in case value > field
  var shares = new Uint32Array(n),
      cryptoObj = window.crypto || window.msCrypto; // IE 11 fix
  cryptoObj.getRandomValues(shares);
  shares[n - 1] = 0;
  var sumRandomShares = shares.reduce(function (e1, e2) {
    return _mod(e1 + e2, field);
  });
  shares[n - 1] = _mod(value - sumRandomShares, field);
  return shares;
}

/**
 *
 * @param share1
 * @param share2
 * @param field
 */
function _addShares (share1, share2, field) {
  return _mod(share1 + share2, field);
}

/**
 *
 * @param shares
 * @param field
 */
function _recombine (shares, field) {
  return shares.reduce(function (e1, e2) {
    return _mod(e1 + e2, field); 
  });
}

/**
 *
 * @param tuples
 * @param field
 */
function secretShareValues (tuples, field) {
  var serviceTuples = {},
      analystTuples = {};

  for (var key in tuples) {
    if (tuples.hasOwnProperty(key)) {
      var value = tuples[key],
          shares = _secretShare(value, 2, field);
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
 * @param modulus
 * @param includeCounts
 * @param db
 */
function aggregateShares (data, modulus, includeCounts, db) {

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
  var promises = [];

  // Compute the aggregate.
  var agg = {};
  for (var key in fields(data[0])) {
    agg[key] = 0;
  }
  for (var i = 0; i < data.length; i++) {
    for (let key in agg) {
      agg[key] = _addShares(agg[key], convert(fields(data[i])[key]), modulus);
    }
  }

  return agg;
}

/**
 *
 * @param serviceTuples
 * @param analystTuples
 * @param modulus
 */
function recombineValues (serviceTuples, analystTuples, modulus) {
  var res = {};
  for (var field in serviceTuples) {
    if (serviceTuples.hasOwnProperty(field)) {
      res[field] = _recombine([serviceTuples[field], analystTuples[field]], modulus);                      
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
