define(['mpc', 'pki', 'BigNumber', 'jiff', 'jiff_bignumber', 'jiff_restAPI', 'table_template'], function (mpc, pki, BigNumber, jiff, jiff_bignumber, jiff_restAPI, table_template) {
  jiff.dependencies({ io: jiff_restAPI.io });

  var cryptoHooks = {
    encryptSign: function (jiff, message, receiver_public_key) {
      // Analyst never encrypts anything
      if (jiff.id === 1) {
        return message;
      }

      // Submitters only encrypt analyst share
      if (receiver_public_key == null || receiver_public_key === '' || receiver_public_key === 's1') {
        return message;
      }

      return pki.encrypt(message, receiver_public_key);
    },
    decryptSign: function (jiff, cipher, secret_key, sender_public_key) {
      // Submitters never decrypt anything
      if (jiff.id !== 1) {
        return cipher;
      }

      // Analyst only decrypts shares from submitters
      if (sender_public_key === 's1') {
        // Do not decrypt messages from the server
        return cipher;
      }

      return pki.decrypt(cipher, secret_key);
    },
    parseKey: function (jiff, keyString) {
      // We really parse just one key, the analyst key
      if (keyString == null || keyString === '' || keyString === 's1') {
        return keyString;
      }

      return pki.parsePublicKey(keyString);
    },
    dumpKey: function (jiff, key) {
      // No one cares about the submitters keys, dump the empty defaults
      if (jiff.id !== 1) {
        return key;
      }

      // Analyst public key will never be dumped except by the analyst
      // do not return anything (undefined) so that the public key
      // is never modified.
    }
  };

  // initialize jiff instance
  var initialize = function (session, role, options) {
    var baseOptions = {
      autoConnect: false,
      sodium: false,
      hooks: {
        createSecretShare: [function (jiff, share) {
          share.refresh = function () {
            return share;
          };
          return share;
        }]
      },
      public_keys: {
        's1': 's1'
      }
    };
    baseOptions = Object.assign(baseOptions, options);
    baseOptions.hooks = Object.assign({}, baseOptions.hooks, cryptoHooks);
    var bigNumberOptions = { Zp: '618970019642690137449562111' }; // 2^89-1

    var restOptions = {
      flushInterval: 0,
      pollInterval: 0,
      maxBatchSize: 1000
    };

    var instance = jiff.make_jiff('http://localhost:8080', session, baseOptions);
    instance.apply_extension(jiff_bignumber, bigNumberOptions);
    instance.apply_extension(jiff_restAPI, restOptions);

    instance.connect(true);
    return instance;
  };

  // Client side stuff
  var clientSubmit = function (sessionkey, userkey, dataSubmission, callback) {
    var ordering = mpc.consistentOrdering(table_template);
    var values = [];

    // List values according to consistent ordering
    for (var i = 0; i < ordering.tables.length; i++) {
      var t = ordering.tables[i];
      values.push(dataSubmission[t.table][t.row][t.col]);
    }
    for (var j = 0; j < ordering.questions.length; j++) {
      var q = ordering.questions[j];
      values.push(dataSubmission['questions'][q.question][q.option]);
    }

    for (var k = 0; k < ordering.usability.length; k++) {
      const m = ordering.usability[k].metric;
      const f = ordering.usability[k].field;
      if (f !== null) {
        values.push(dataSubmission.usability[m][f]);
      } else {
        values.push(dataSubmission.usability[m]);
      }
    }

    // Handle jiff errors returned from server
    var options = {
      onError: function (errorString) {
        callback(null, JSON.stringify({ status: false, error: errorString }));
      },
      initialization: {
        userkey: userkey
      }
    };

    // Initialize and submit
    var jiff = initialize(sessionkey, 'client', options);
    jiff.wait_for([1, 's1'], function () {
      // After initialization
      jiff.restReceive = function () {
        jiff.disconnect(false, false);
        callback.apply(null, arguments);
      };
      for (var i = 0; i < values.length; i++) {
        jiff.share(values[i], null, [1, 's1'], [jiff.id]);
        // Share the square of the input for standard deviation: only for tables, but not for questions
        if (i < ordering.tables.length) {
          jiff.share(new BigNumber(values[i]).pow(2), null, [1, 's1'], [jiff.id]);
        }
      }
      jiff.restFlush();
    });
  };

  // Analyst side stuff
  var computeAndFormat = function (sessionkey, password, secretkey, error, callback) {
    var options = {
      onError: error,
      secret_key: pki.parsePrivateKey(secretkey),
      party_id: 1,
      initialization: {
        password: password
      }
    };

    // Initialize
    var jiff = initialize(sessionkey, 'analyst', options);
    // Listen to the submitter ids from server
    jiff.listen('compute', function (party_id, msg) {
      if (party_id !== 's1') {
        return;
      }

      // Meta-info
      var ordering = mpc.consistentOrdering(table_template);
      var submitters = JSON.parse(msg);

      // Compute and Format
      var promise = mpc.compute(jiff, submitters, ordering);
      promise = mpc.format(promise, submitters, ordering);
      promise.then(function (result) {
        jiff.disconnect(false, false);
        callback(result);
      }).catch(function (err) {
        error(err);
      });
    });
  };

  // Exports
  return {
    client: {
      submit: clientSubmit
    },
    analyst: {
      computeAndFormat
    }
  }
});
