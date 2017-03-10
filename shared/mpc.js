/***************************************************************
 *
 * mpc.js
 *
 * Shared module for MPC functionality.
 *
 */

var FIELD = 4294967296; // 2^32

/**
 *
 * @param value
 * @param modulus
 */
function _mod (value, modulus) {
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
function recombine (shares, field) {
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

function aggregateShares (data, modulus, includeCounts, db) {

    // By default, this is not for the database calculation.
    if (db == null)
        db = false;

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
            promises.push(Promise.resolve(fields(data[i])[key]).then(function (value) {
                agg[key] = _addShares(agg[key], convert(value), modulus);
            }));
        }
    }

    return Promise.all(promises)
      .then(function () {
          return agg;
      });
}

if (typeof module !== 'undefined') {
  module.exports = {
    'FIELD': FIELD,
    'aggregateShares': aggregateShares,
    'recombine': recombine
  };
}
  
/*eof*/
