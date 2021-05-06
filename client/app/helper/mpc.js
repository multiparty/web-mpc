if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([], function () {
  var setOrAssign = function (obj, keys, value) {
    for (var i = 0; i < keys.length - 1; i++) {
      var key = keys[i];
      if (obj[key] == null) {
        obj[key] = {};
      }

      obj = obj[key];
    }

    obj[keys[keys.length - 1]] = value;
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
    // hack in ratios for 2021 pacesetters deployment
    for (var l = 0; l < 3; l++) {
      var table_def =  table_template.tables[l];
      var table_name = table_template.tables[l].name + ' : ' + table_template.tables[l+3].name;

      var rows = table_def.rows;
      var cols = table_def.cols[table_def.cols.length - 1];
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < cols.length; c++) {
          var row = rows[r].key;
          var col = cols[c].key;
          tables.push({ table: table_name, row: row, col: col });
        }
      }
    }
    // order questions
    if (table_template.survey != null) {
      for (var q = 0; q < table_template.survey.questions.length; q++) {
        var question = table_template.survey.questions[q];
        for (var o = 0; o < question.inputs.length; o++) {
          var option = question.inputs[o].value;
          var label = question.inputs[o].label;
          questions.push({ question: question.question_text, option: option, label: label });
        }
      }
    }

    // order usability metrics
    if (table_template.usability != null) {
      for (var m = 0; m < table_template.usability.length; m++) {
        var metric = table_template.usability[m];

        if (typeof(metric) === 'string') {
          usability.push({metric: metric, field: ''});
        } else if (typeof(metric) === 'object') {
          var key = Object.keys(metric)[0];
          var arr = metric[key];
          for (var f = 0; f < arr.length; f++) {
            var field = arr[f];
            usability.push({metric: key, field: field});
          }
        }
      }
    }

    return { tables: tables, questions: questions, usability:usability };
  };

  // Compute the function over table data under MPC for a single cohort
  var computeTable = function (jiff_instance, cohortIds, ordering) {
    var result = [];
    for (var k = 0; k < ordering.tables.length; k++) {
      var subid = cohortIds[0];

      // Sum for averaging
      var entry_sum = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];
      // Standard deviation is only computed under MPC for tables
      var entry_squares_sum = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];

      for (var p = 1; p < cohortIds.length; p++) {
        subid = cohortIds[p];

        // Sum entries
        var single_share = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];
        entry_sum = entry_sum.sadd(single_share);

        // Sum squares
        single_share = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];
        entry_squares_sum = entry_squares_sum.sadd(single_share);
      }
      // For entries in the table, we return a promise to an object
      //    { sum: <sum of inputs>, squaresSum: <sum of squared inputs> }
      var promise1 = jiff_instance.open(entry_sum, [1]);
      var promise2 = jiff_instance.open(entry_squares_sum, [1]);
      if (jiff_instance.id === 1) {
        var promise = Promise.all([promise1, promise2]).then(function (results) {
          return { sum: results[0], squaresSum: results[1]};
        });
        result.push(promise);
      }
    }

    return result;
  };
  // Compute the function over question data under MPC for a single cohort
  var computeQuestions = function (jiff_instance, cohortIds, ordering) {
    var result = [];
    for (var k = ordering.tables.length; k < ordering.tables.length + ordering.questions.length; k++) {
      var subid = cohortIds[0];

      // Sum for averaging
      var entry_sum = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];
      for (var p = 1; p < cohortIds.length; p++) {
        subid = cohortIds[p];

        // Sum entries
        var single_share = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];
        entry_sum = entry_sum.sadd(single_share);
      }

      // For entries in the table, we return a promise to an object
      //    { sum: <sum of inputs>, squaresSum: <sum of squared inputs> }
      var promise = jiff_instance.open(entry_sum, [1]);
      result.push(promise);
    }

    return result;
  };

  // Compute MPC functions over table and questions data per cohort
  var computeCohort = function (jiff_instance, cohortIds, ordering) {
    var result = computeTable(jiff_instance, cohortIds, ordering);
    return Promise.all(result.concat(computeQuestions(jiff_instance, cohortIds, ordering)));
  };

  // Compute MPC usability function over all cohorts
  var computeUsability = function (jiff_instance, allIds, ordering) {
    var result = [];
    for (var k = ordering.tables.length + ordering.questions.length; k < ordering.tables.length + ordering.questions.length + ordering.usability.length; k++) {
      var subid = allIds[0];

      var entry_sum = jiff_instance.share(null, null, [1, 's1'], [subid]);
      entry_sum = entry_sum[subid];

      for (var p = 1; p < allIds.length; p++) {
        subid = allIds[p];

        var single_share = jiff_instance.share(null, null, [1, 's1'], [subid]);
        single_share = single_share[subid];
        entry_sum = entry_sum.sadd(single_share);
      }

      var promise = jiff_instance.open(entry_sum, [1]);
      result.push(promise);
    }

    return Promise.all(result);
  };

  var compute = function (jiff_instance, submitters, ordering) {
    var all_promises = [];
    for (var i = 0; i < submitters['cohorts'].length; i++) {
      var cohort = submitters['cohorts'][i];

      all_promises.push(computeCohort(jiff_instance, submitters[cohort], ordering));
    }
    all_promises.push(computeUsability(jiff_instance, submitters['all'], ordering));

    // format
    if (jiff_instance.id === 1) {
      return Promise.all(all_promises).then(function (results) {
        var formatted = {cohorts: {}};
        for (var i = 0; i < submitters['cohorts'].length; i++) {
          var cohort = submitters['cohorts'][i];
          formatted['cohorts'][cohort] = results[i];
        }
        formatted['usability'] = results[results.length - 1];
        return formatted;
      });
    }
  };

  // Return format
  // {
  //   averages: { <cohort number>: { table row: { table col: average } }, ..., 'total': { same format but for all cohorts } }
  //   deviations: { <cohort number>: { table row: { table col: deviation } }, ..., 'total': { same format but for all cohorts } }
  //   questions: { <cohort number>: { question text: { questions option: count } }, ..., 'total': { same format but for all cohorts } }
  //   usability: { metrics_object ...  no cohorts, the object is immediate for all cohorts }
  // }
  var format = function (results, submitters, ordering) {
    var averages = {};
    var questions = {};
    var deviations = {};
    var usability = {};


    // format averages and deviations as [<cohort>][<table>][<row>][<col>] = avg or std dev
    for (var i = 0; i < ordering.tables.length; i++) {
      var totalMean = 0;
      var totalDev = 0;

      for (var j = 0; j < submitters['cohorts'].length; j++) {
        var cohort = submitters['cohorts'][j];

        var table = ordering.tables[i].table;
        var row = ordering.tables[i].row;
        var col = ordering.tables[i].col;

        // Compute mean/average
        var mean = results['cohorts'][cohort][i].sum;
        // ratios are multiplied by a 1000 and truncated on the client side before submit
        if (table.includes(':') && mean !== 0) {
          console.log(mean);
        }
        totalMean = mean.add(totalMean);
        mean = mean.div(submitters[cohort].length);

        // Compute standard deviation
        var deviation = results['cohorts'][cohort][i].squaresSum;
        // ratios are multiplied by a 1000 and truncated on the client side before submit
        if (table.includes(':') && deviation !== 0) {
          console.log(deviation);
        }
        totalDev = deviation.add(totalDev);
        deviation = deviation.div(submitters[cohort].length);
        deviation = deviation.minus(mean.pow(2));
        deviation = deviation.sqrt();

        setOrAssign(averages, [cohort, table, row, col], mean.toFixed(2));
        setOrAssign(deviations, [cohort, table, row, col], deviation.toFixed(2));
      }

      // Compute mean and average for total
      totalMean = totalMean.div(submitters['all'].length);
      totalDev = totalDev.div(submitters['all'].length);
      totalDev = totalDev.minus(totalMean.pow(2));
      totalDev = totalDev.sqrt();

      setOrAssign(averages, ['all', table, row, col], totalMean.toFixed(2));
      setOrAssign(deviations, ['all', table, row, col], totalDev.toFixed(2));
    }

    // format questions as questions[<cohort>][<question>][<option>] = count of parties that choose this option
    for (i = 0; i < ordering.questions.length; i++) {
      var total = 0;
      for (j = 0; j < submitters['cohorts'].length; j++) {
        cohort = submitters['cohorts'][j];

        var question = ordering.questions[j].question;
        var label = ordering.questions[j].label;

        var value = results['cohorts'][cohort][ordering.tables.length + j];
        total = value.add(total);

        setOrAssign(questions, [cohort, question, label], value.toString());
      }
      setOrAssign(questions, ['all', question, label], total.toString());
    }

    // format usability as usability[<metric>][<field>] = value
    for (i = 0; i < ordering.usability.length; i++) {
      var metric = ordering.usability[i].metric;
      var field = ordering.usability[i].field;
      value = results['usability'][i];

      setOrAssign(usability, [metric, field], value.toString());
    }

    return {
      averages: averages,
      questions: questions,
      deviations: deviations,
      usability: usability,
      hasQuestions: ordering.questions.length > 0,
      hasUsability: ordering.usability.length > 0,
      cohorts: submitters,
    };
  };

  return {
    consistentOrdering: consistentOrdering,
    compute: compute,
    format: format
  }
});
