if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/***************************************************************
 *
 * mpc.js
 *
 * Shared module for MPC functionality.
 *
 */
/*eslint no-console: ["error", { allow: ["warn", "error"] }] */

define(['forge'], function (forge) {

  'use strict';

  var MAX_VALUE = 1099511627776; // 2^40

  /**
   *
   * @param value
   */
  function _uint32(value) {
    return ((value % MAX_VALUE) + MAX_VALUE) % MAX_VALUE;
  }

  /**
   *
   * @param value
   */
  function _inUint32Range(value) {
    return (0 <= value) && (value < MAX_VALUE);
  }

  function _random(max) {
    // Use rejection sampling to get random value with normal distribution
    // Generate random Uint8 values of 1 byte larger than the max parameter
    // Reject if random is larger than quotient * max (remainder would cause biased distribution), then try again

    // Values up to 2^53 should be supported, but log2(2^49) === log2(2^49+1), so we lack the precision to easily
    // determine how many bytes are required
    if (max > 562949953421312) {
      throw new RangeError('Max value should be smaller than or equal to 2^49');
    }

    var crypto = window.crypto || window.msCrypto;
    // Polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2
    // TODO should we use Babel for this?
    Math.log2 = Math.log2 || function (x) {
      return Math.log(x) * Math.LOG2E;
    };
    var bitsNeeded = Math.ceil(Math.log2(max));
    var bytesNeeded = Math.ceil(bitsNeeded / 8);
    var randomBytes = new Uint8Array(bytesNeeded);
    var maxValue = Math.pow(256, bytesNeeded);

    // Keep trying until we find a random value within a normal distribution
    while (true) {
      crypto.getRandomValues(randomBytes);
      var randomValue = 0;

      for (var i = 0; i < bytesNeeded; i++) {
        randomValue = randomValue * 256 + randomBytes[i];
      }

      // randomValue should be smaller than largest multiple of max within maxBytes
      if (randomValue < maxValue - maxValue % max) {
        return randomValue % max;
      }
    }
  }

  /**
   *
   * @param value
   * @param n
   */
  function _secretShare(value, n) {
    if (!_inUint32Range(value)) {
      throw new Error('Input value outside valid range');
    }
    var uvalue = _uint32(value),
      rvalues = [];

    for (var i = 0; i < n; i++) {
      rvalues.push(_random(MAX_VALUE))
    }

    rvalues[n - 1] = _uint32(0);

    var sumRandomShares = rvalues.reduce(function (e1, e2) {
      return _uint32(e1 + e2);
    });
    rvalues[n - 1] = _uint32(uvalue - sumRandomShares);
    return rvalues;
  }

  /**
   *
   * @param share1
   * @param share2
   */
  function _addShares(share1, share2) {
    return _uint32(share1 + share2);
  }

  /**
   *
   * @param shares
   */
  function _recombine(shares) {
    return shares.reduce(function (e1, e2) {
      return _uint32(e1 + e2);
    });
  }

  /**
   *
   * @param obj
   */
  function secretShareValues(obj) {
    var dataTuples = {}, // previously serviceTuples
      maskTuples = {}; // previously analystTuples

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = obj[key];
        if (typeof(value) === 'number') {
          var shares = _secretShare(value, 2);

          dataTuples[key] = shares[0];
          maskTuples[key] = shares[1];
        } else {
          // value is a nested object.
          var tmp = secretShareValues(value);
          dataTuples[key] = tmp['data'];
          maskTuples[key] = tmp['mask'];
        }
      }
    }

    return {
      data: dataTuples,
      mask: maskTuples
    };
  }

  /**
   * Helper used in countInvalidShares and aggregate shares.
   * Makes a (deep) copy of the passed javascript object, and initializes every
   * value to the passed value.
   * @param {json/mongo module} obj - the object to copy.
   * @param {} init_value - the desired initial value.
   * @param {function(json/mongo module)} fields - a function that allows us to access fields inside obj.
   */
  function initialize(obj, init_value, fields) {
    var result = {};
    for (var key in fields(obj)) {
      if (fields(obj).hasOwnProperty(key) && key !== '0') {
        if (typeof(fields(obj)[key]) === 'number' || typeof(fields(obj)[key]) === 'string') {
          result[key] = init_value;
        } else {
          result[key] = initialize(fields(obj)[key], init_value, fields);
        }
      }
    }
    return result;
  }

  /**
   * Accumulate obj into accumulator using f.
   * @param {json/mongo module} obj - the object currently being add/processed into accumulator.
   * @param {json} accumulator - a javascript object matching the obj key schema.
   *    every value of accumulator will be accumulated using f with the corresponding value in obj.
   *    and then overwriten by the result (accumulator mutates).
   * @param {function(json/mongo modules)} fields - a function that allows us to access fields inside obj.
   * @param {function(string)} convert - a function that converts the given string into unsigned 32bits integer.
   * @param {function(u32int, u32int)} f - a function that combines/accumulates the current value in accumulator
   *    and obj (should return the result of accumulation).
   */
  function accumulate(obj, accumulator, fields, convert, f) {
    for (var key in fields(obj)) {
      if (fields(obj).hasOwnProperty(key) && key !== '0') {
        if (typeof(fields(obj)[key]) === 'number' || typeof(fields(obj)[key]) === 'string') {
          var value = convert(fields(obj)[key]);
          accumulator[key] = f(accumulator[key], value);
        } else {
          accumulate(fields(obj)[key], accumulator[key], fields, convert, f);
        }
      }
    }

    return accumulator;
  }

  /**
   * Counts how many invalid (NaN or out-of-range) shares are in data.
   * @param data {array} - the data to look into.
   * @param db {boolean} - true if this is a server-side invocation with
   *                       data being an array of mongo modules, false if front-end
   *                       with data being an array of json/javascript objects.
   *
   */
  function countInvalidShares(data, db) {
    // By default, this is not for the database calculation.
    if (!db) {
      db = false;
    }

    // Access fields in JSON object or in DB object.
    var fields = function (x) {
      return x;
    }; // if !db, return the object as it is for access.
    if (db) { // if db, then the passed object may be a mongo module, use .fields to access its fields.
      fields = function (x) {
        if (x.fields !== undefined) {
          return x.fields;
        } else {
          return x;
        }
      };
    }

    // Criteria for being invalid for a value (being outside of range).
    // var isInvalid = function (x) { // The node.js way.
    //   return (!_inUint32Range(x) ? 1 : 0);
    // };

    // if(!db) { // The front-end way.
    //   isInvalid = function (x) {
    //     var result = parseInt(x, 10);
    //     var invalid = 0;
    //     if (isNaN(result) || !_inUint32Range(result)) {
    //       invalid = 1;
    //     }
    //     return invalid;
    //   };
    // }

    // Ensure we are always working with an array.
    if (db) { // if db, then what is passed is a collection of mongo modules (not exactly an array).
      var arr = [];
      for (var row in data) {
        arr.push(data[row]);
      }
      data = arr;
    }

    // initialize the invalid count object according to the template
    var invalidCount = initialize(data[0], 0, fields);

    // accummulate invalid count
    for (var i = 0; i < data.length; i++) {
      invalidCount = accumulate(data[i], invalidCount, fields,
        function (v) {
          return v;
        },
        function (acc, v) {
          return acc + v;
        });
    }
    return invalidCount;
  }

  /**
   * Aggregates (sums up) the shares.
   * @param data {array} - the data to aggregate.
   * @param db {boolean} - true if this is a server-side invocation with
   *                       data being an array of mongo modules, false if front-end
   *                       with data being an array of json/javascript objects.
   *
   */
  function aggregateShares(data, db) {
    // By default, this is not for the database calculation.
    if (!db) {
      db = false;
    }

    // Access fields in JSON object or in DB object.
    var fields = function (x) {
      return x;
    }; // if !db, return the object as it is for access.
    if (db) { // if db, then the passed object may be a mongo module, use .fields to access its fields.
      fields = function (x) {
        if (x.fields !== undefined) {
          return x.fields;
        } else {
          return x;
        }
      };
    }

    // Convert numbers to unsigned 32-bits integers.
    var convert = function (x) {
      return _uint32(x);
    } // node.js way.

    if (!db) { // front end way.
      convert = function (x) {
        var result = parseInt(x, 10);
        if (isNaN(result)) {
          console.error('NaN detected in:', x, data);
          result = 0;
        } else if (!_inUint32Range(result)) {
          console.error('Outside range detected in:', x, data);
          result = 0;
        }
        return _uint32(result);
      };
    }

    // Ensure we are always working with an array.
    if (db) { // if db, then what is passed is a collection of mongo modules (not exactly an array).
      var arr = [];
      for (var row in data) {
        arr.push(data[row]);
      }

      data = arr;
    }

    // initialize the aggregate object according to the template
    var agg = initialize(data[0], _uint32(0), fields);

    // aggregate
    for (var i = 0; i < data.length; i++) {
      agg = accumulate(data[i], agg, fields, convert,
        function (acc, v) {
          return _addShares(acc, v);
        });
    }
    return agg;
  }


  function recombineValues(serviceTuples, analystTuples) {
    var res = {};
    for (var field in serviceTuples) {
      if (serviceTuples.hasOwnProperty(field)) {
        var value = serviceTuples[field];
        if (typeof(value) === 'number' || typeof(value) === 'string') {
          res[field] = _recombine([serviceTuples[field], analystTuples[field]]);
        } else {
          res[field] = recombineValues(serviceTuples[field], analystTuples[field]);
        }
      }
    }
    return res;
  }

  function encryptWithKey(obj, key) {
    var pki = forge.pki;
    var publicKey = pki.publicKeyFromPem(key);

    return _encryptWithKey(obj, publicKey);
  }

  function _encryptWithKey(obj, publicKey) {
    var encrypted = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = obj[key];
        if (typeof(value) === 'number' || typeof(value) === 'string') {
          encrypted[key] = publicKey.encrypt(value.toString(), 'RSA-OAEP', {md: forge.md.sha256.create()});

        } else {
          encrypted[key] = _encryptWithKey(value, publicKey);
        }
      }
    }
    return encrypted;
  }

  // if (typeof module !== 'undefined') {
  //   module.exports = {
  //     'aggregateShares': aggregateShares,
  //     'countInvalidShares': countInvalidShares
  //   };
  // }

  return {
    aggregateShares: aggregateShares,
    countInvalidShares: countInvalidShares,
    secretShareValues: secretShareValues,
    encryptWithKey: encryptWithKey,
    recombineValues: recombineValues
  }

});
