if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
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
  var consistentOrdering = function (table_template) {
    var tables = [];
    var questions = [];
    var usability = [];
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
    if (table_template.survey !== undefined) {
      for (var q = 0; q < table_template.survey.questions.length; q++) {
        var question = table_template.survey.questions[q];
        for (var o = 0; o < question.inputs.length; o++) {
          var option = question.inputs[o].value;
          var label = question.inputs[o].label;
          questions.push({ question: question.question_text, option: option, label: label });
        }
      }
    }

    if (table_template.usability !== undefined) {
      for (let metric of table_template.usability) {
        if (typeof(metric) === 'string') {
          usability.push({metric: metric, field: null});
        } else if (typeof(metric) === 'object') {
          const key = Object.keys(metric)[0];
          const fields = metric[key];
  
          for (let f of fields) {
            usability.push({metric: key, field: f});
          }
        }
      }
    }

    return { tables, questions, usability };
  };

  var compute = function (jiff_instance, submitters, ordering) {
    // go through all the tables and questions one entry at a time
    // sum all received shares for that entry, and reveal the sum
    // for that element to the analyst in order.
    var shares = [];
    for (var k = 0; k < ordering.tables.length + ordering.questions.length + ordering.usability.length; k++) {
      var subid = submitters[0];

      var entry_sum = jiff_instance.share(null, null, [1, 's1'], [subid]);
      entry_sum = entry_sum[subid];

      // Standard deviation is only computed under MPC for tables
      var entry_squares_sum;
      if (k < ordering.tables.length) {
        entry_squares_sum = jiff_instance.share(null, null, [1, 's1'], [subid]);
        entry_squares_sum = entry_squares_sum[subid];
      }

      for (var p = 1; p < submitters.length; p++) {
        subid = submitters[p];

        var single_share = jiff_instance.share(null, null, [1, 's1'], [subid]);
        single_share = single_share[subid];
        entry_sum = entry_sum.sadd(single_share);

        if (k < ordering.tables.length) {
          var single_square = jiff_instance.share(null, null, [1, 's1'], [subid]);
          single_square = single_square[subid];
          entry_squares_sum = entry_squares_sum.sadd(single_square);
        }
      }

      var promise = jiff_instance.open(entry_sum, [1]);

      // For entries in the table, we return a promise to an object
      //    { sum: <sum of inputs>, squaresSum: <sum of squared inputs> }
      // For questions, we return a promise to a single sum/number corresponding to an option
      if (k < ordering.tables.length) {
        var promise2 = jiff_instance.open(entry_squares_sum, [1]);
        if (jiff_instance.id === 1) {
          promise = Promise.all([promise, promise2]).then(function (results) {
            return { sum: results[0], squaresSum: results[1]};
          });
        }
      }

      shares.push(promise);
    }
    return Promise.all(shares);
  };

  // will be filled with shares coming in from submitters
  // shares[0] will be all the shares received from the first party in submitters
  //   and is an object on the form:
  //   {
  //      <table 1 name>: { <row 1 key>: { <col 1 key>: <share object>,<col 2 key>: <share object>, ... }, ... }
  //      ...
  //      <questions>: {
  //        <question 1 text>: { <option 1 value>: <share object>, <option 2 value>: <share object>, ... },
  //        ...
  //      }
  //   }
  var format = function (resultsPromise, submitters, ordering) {
    return resultsPromise.then(function (results) {

      var averages = {}; // results array will be transformed to an object of the correct form
      var questions = {};
      var deviations = {};
      var usability = {};

      for (var i = 0; i < ordering.tables.length; i++) {
        var table = ordering.tables[i].table;
        var row = ordering.tables[i].row;
        var col = ordering.tables[i].col;

        // Compute mean/average
        var mean = results[i].sum;
        mean = mean.div(submitters.length);

        // Compute standard deviation
        var deviation = results[i].squaresSum;
        deviation = deviation.div(submitters.length);
        deviation = deviation.minus(mean.pow(2));
        deviation = deviation.sqrt();

        if (averages[table] == null) {
          averages[table] = {};
          deviations[table] = {};
        }
        if (averages[table][row] == null) {
          averages[table][row] = {};
          deviations[table][row] = {};
        }
        averages[table][row][col] = mean.toFixed(2); // returns a string, with 2 digits after decimal
        deviations[table][row][col] = deviation.toFixed(2);
      }

      // format questions as questions[<question>][<option>] = count of parties that choose this option
      for (var j = 0; j < ordering.questions.length; j++) {
        var question = ordering.questions[j].question;
        var label = ordering.questions[j].label;

        if (questions[question] == null) {
          questions[question] = {};
        }
        questions[question][label] = results[i+j].toString();
      }

      for (let k = 0; k < ordering.usability.length; k++) {

        const m = ordering.usability[k].metric;
        const f = ordering.usability[k].field;
        const value = results[i+j+k].toString();

        if (f === null) {
          usability[m] = value;
        } else {
          if (!(m in usability)) {
            usability[m] = {};
          }
          usability[m][f] = value;
        
        }
      }
      return { averages: averages, questions: questions, deviations: deviations, usability: usability };
    });
  };

  return {
    consistentOrdering: consistentOrdering,
    compute: compute,
    format: format
  }
});
