define(['BigNumber', 'jiff', 'jiff_bignumber', 'jiff_restAPI'], function (BigNumber, jiff, jiff_bignumber, jiff_restAPI) {
  // initialize jiff instance
  var initialize = function (session, connectImmediately, options, initializationParams) {
    jiff.dependencies({ io: jiff_restAPI.io });
    var baseOptions = {
      autoConnect: false,
      sodium: false,
      hooks: {
        beforeOperation: [ function (jiff, op, msg) {
          if (op === 'initialization') {
            msg = Object.assign(msg, initializationParams, { party_count: 1000000 });
          }
          return msg;
        }]
      }
    };
    baseOptions = Object.assign(baseOptions, options);

    var bigNumberOptions = {
      Zp: new BigNumber(2).pow(65).minus(49) // Fits unsigned longs
    };

    var restOptions = {
      flushInterval: 0,
      pollInterval: 0,
      maxBatchSize: 1000
    };

    var instance = jiff.make_jiff('http://localhost:8080', session, baseOptions);
    // instance.apply_extension(jiff_bignumber, bigNumberOptions);
    instance.apply_extension(jiff_restAPI, restOptions);
    instance.connect(connectImmediately);
    return instance;
  };

  // Order: consistent order on values as defined in the template.
  // The order will be the same on client, server, and analyst side.
  // Order:
  // 1. first tables data, then questions (if exist)
  // 2. tables come in the order they are defined in the template in.
  // 3. table is traversed by rows, then columns, in the order they are defined in the template in.
  // 4. questions come in the order they are defined in.
  // 5. for each question, the options come in the order they are defined in.
  // The returned object is formatted as follows:
  // {
  //   tables: [ { table: <first table name>, row: <first row key>, col: <first col key> }, ... ]
  //   questions: [ { question: <first question text>, option: <first option value> }, ... ]
  // }
  function consistentOrdering(table_template) {
    var tables = [];
    var questions = [];
    // order tables
    for (var i = 0; i < table_template.tables.length; i++) {
      var table_def = table_template.tables[i];
      if (table_def.submit === false) {
        continue;
      }

      var rows = table_def.rows;
      var cols = table_def.cols[table_def.cols.length - 1];
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < cols.length; c++) {
          var row = rows[r].key;
          var col = cols[c].key;
          tables.push({ table: table_def.name, row: row, col: col });
        }
      }
    }
    // order questions
    if (table_template.survey != null) {
      for (var q = 0; q < table_template.survey.questions.length; q++) {
        var question = table_template.survey.questions[q];
        for (var o = 0; o < question.inputs.length; o++) {
          var option = question.inputs[o].value;
          questions.push({ question: question.question_text, option: option });
        }
      }
    }
    return { questions: questions, tables: tables };
  }

  // Client side stuff
  var clientSubmit = function (sessionkey, userkey, dataSubmission, table_template, callback) {
    var ordering = consistentOrdering(table_template);
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
    var onError = function (errorString) {
      callback(null, JSON.stringify({ status: false, error: errorString }));
    };

    // Initialize and submit
    var jiff = initialize(sessionkey, true, { onError: onError }, { userkey: userkey });
    jiff.wait_for(['s1'], function () { // TODO put 1 back after testing
      // After initialization
      jiff.restReceive = callback;
      for (var i = 0; i < values.length; i++) {
        jiff.share(values[i], null, [1, 's1'], [jiff.id]);
      }
      jiff.restFlush();
    });
  };

  // Analyst side stuff

  // Exports
  return {
    client: {
      submit: clientSubmit
    }
  }
});
