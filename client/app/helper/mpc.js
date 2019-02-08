if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  // TOOD: move this to data table
  const usabilityDef = {
    browser: ['brave', 'chrome', 'edge', 'firefox', 'opera', 'other', 'safari'],
    time_spent: []
  }

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
  var consistentOrdering = function (tableTemplate) {
    var tables = [];
    var questions = [];
    var usability = [];
    // order tables
    for (var i = 0; i < tableTemplate.tables.length; i++) {
      var table_def = tableTemplate.tables[i];
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
    if (tableTemplate.survey != null) {
      for (var q = 0; q < tableTemplate.survey.questions.length; q++) {
        var question = tableTemplate.survey.questions[q];
        for (var o = 0; o < question.inputs.length; o++) {
          var option = question.inputs[o].value;
          var label = question.inputs[o].label;
          questions.push({ question: question.question_text, option: option, label: label });
        }
      }
    }

    for (let key in usabilityDef) {
      if (usabilityDef[key].length > 0) {
        for (let f of usabilityDef[key]) {
          usability.push({metric: key, field: f});
        }
      } else {
        usability.push({metric: key, field: null});
      }
    }
    return { tables: tables, questions: questions, usability: usability };
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

        results[i] = results[i].div(submitters.length);
        results[i] = results[i].toFixed(2); // returns a string, with 2 digits after decimal
        if (finalObject[table] == null) {
          finalObject[table] = {};
        }
        if (finalObject[table][row] == null) {
          finalObject[table][row] = {};
        }
        finalObject[table][row][col] = results[i];
      }

      for (var j = 0; j < ordering.questions.length; j++) {
        var question = ordering.questions[j].question;
        var label = ordering.questions[j].label;

        if (finalObject['questions'] == null) {
          finalObject['questions'] = {};
        }
        if (finalObject['questions'][question] == null) {
          finalObject['questions'][question] = {};
        }
        finalObject['questions'][question][label] = results[i+j].toString();
      }

      // TODO: make this generic
      finalObject['usability'] = {
        'data_prefilled': 0,
        'time_spent': 0,
        'browser': {}
      };

      for (let k = 0; k < ordering.usability.length; k++) {
        const m = ordering.usability[k].metric;
        const f = ordering.usability[k].field;
      
        const value = results[i+j+k].c[0].toString();

        if (f === null) {
          finalObject.usability[m] = value;
        } else {
          finalObject.usability[m][f] = value;          
        }
      }

      console.log('final',finalObject)

      return finalObject;
    });
  };

  return {
    consistentOrdering: consistentOrdering,
    compute: compute,
    format: format
  }
});
