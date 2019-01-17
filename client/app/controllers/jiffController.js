define(['BigNumber', 'jiff', 'jiff_bignumber', 'jiff_restAPI'], function (BigNumber, jiff, jiff_bignumber, jiff_restAPI) {
  // initialize jiff instance
  var initialize = function (connectImmediately) {
    jiff.dependencies({ io: jiff_restAPI.io });
    var baseOptions = {
      autoConnect: false,
      sodium: false
    }

    var bigNumberOptions = {
      Zp: new BigNumber(2).pow(65).minus(49) // Fits unsigned longs
    };

    var restOptions = {
      flushInterval: 0,
      pollInterval: 0,
      maxBatchSize: 1000
    };

    var instance = jiff.make_jiff('127.0.0.1:8080', 'hello', baseOptions);
    // instance.apply_extension(jiff_bignumber, bigNumberOptions);
    instance.apply_extension(jiff_restAPI, restOptions);
    instance.connect(connectImmediately);
    return instance;
  };

  // Client side stuff
  var clientSubmit = function (dataSubmission, table_template) {
    console.log(dataSubmission);
  };

  // Analyst side stuff

  // Exports
  return {
    client: {
      submit: clientSubmit
    }
  }
});
