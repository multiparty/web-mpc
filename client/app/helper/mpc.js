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
    return { tables: tables, questions: questions };
  };

  var compute = function (jiff_instance, submitters, ordering) {
    // go through all the tables and questions one entry at a time
    // sum all received shares for that entry, and reveal the sum
    // for that element to the analyst in order.
    var shares = [];
    for (var k = 0; k < ordering.tables.length + ordering.questions.length; k++) {
      var subid = submitters[0];
      var entry_sum = jiff_instance.share(null, null, [1, 's1'], [subid]);
      entry_sum = entry_sum[subid];

      for (var p = 1; p < submitters.length; p++) {
        subid = submitters[p];

        var single_share = jiff_instance.share(null, null, [1, 's1'], [subid]);
        single_share = single_share[subid];

        entry_sum = entry_sum.sadd(single_share);
      }

      var promise = jiff_instance.open(entry_sum, [1]);
      if (jiff_instance.id === 1) {
        shares.push(promise);
      }
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
      var finalObject = {}; // results array will be transformed to an object of the correct form
      for (var i = 0; i < ordering.tables.length; i++) {
        var table = ordering.tables[i].table;
        var row = ordering.tables[i].row;
        var col = ordering.tables[i].col;

        results[i] = results[i] / submitters.length;
        if (finalObject[table] == null) {
          finalObject[table] = {};
        }
        if (finalObject[table][row] == null) {
          finalObject[table][row] = {};
        }
        finalObject[table][row][col] = results[i];
      }

      return finalObject;
    });
  };

  return {
    consistentOrdering: consistentOrdering,
    compute: compute,
    format: format
  }
});
