define(['mpc', 'BigNumber', 'jiff', 'jiff_bignumber', 'jiff_restAPI', 'table_template'], function (mpc, BigNumber, jiff, jiff_bignumber, jiff_restAPI, table_template) {
  jiff.dependencies({ io: jiff_restAPI.io });

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
      }
    };
    baseOptions = Object.assign(baseOptions, options);

    /*
    var bigNumberOptions = {
      Zp: new BigNumber(2).pow(65).minus(49) // Fits unsigned longs
    };
    */

    var restOptions = {
      flushInterval: role === 'analyst' ? 1000 : 0,
      pollInterval: 0,
      maxBatchSize: 1000
    };

    var instance = jiff.make_jiff('http://localhost:8080', session, baseOptions);
    // instance.apply_extension(jiff_bignumber, bigNumberOptions);
    instance.apply_extension(jiff_restAPI, restOptions);

    instance.connect();
    return instance;
  };

  // Client side stuff
  var clientSubmit = function (sessionkey, userkey, dataSubmission, callback) {
    console.log(dataSubmission);
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
      jiff.restReceive = callback;
      for (var i = 0; i < values.length; i++) {
        jiff.share(values[i], null, [1, 's1'], [jiff.id]);
      }
      jiff.restFlush();
    });
  };

  // Analyst side stuff
  var computeAndFormat = function (sessionkey, password, secretkey, error, callback) {
    var options = {
      onError: error,
      secret_key: secretkey,
      party_id: 1,
      initialization: {
        password: password
      }
    };

    var jiff = initialize(sessionkey, 'analyst', options);
    jiff.wait_for([1, 's1'], function () {
      jiff.emit('compute', ['s1'], '', false);

      var inCompute = false;
      jiff.listen('compute', function (party_id, msg) {
        if (party_id !== 's1' || inCompute) {
          return;
        }

        inCompute = true;
        var ordering = mpc.consistentOrdering(table_template);
        var submitters = JSON.parse(msg);

        var promise = mpc.compute(jiff, submitters, ordering);
        promise = mpc.format(promise, submitters, ordering);
        promise.then(function (result) {
          jiff.disconnect(false, false);
          callback(result);
        }).catch(function (err) {
          error(err);
        });
      });
    });
  };

  // Exports
  return {
    client: {
      submit: clientSubmit
    },
    analyst: {
      computeAndFormat: computeAndFormat
    }
  }
});
