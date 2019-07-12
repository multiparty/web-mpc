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

  // Sum the shares of tables data belonging to the given parties
  // The shares are summed cell-wise: each party shares a single value per cell per table
  // Shares belonging to a single cell from all given parties are summed and the result is
  // Opened and Returned according to the same format as the given ordering.
  // NOTE: because of the way the <jiff>.share() functions are synchronized together
  // calling this function several times on the same party ids will yield different result.
  // The first time this is called for a party id, <jiff>.share() will sync up with the first
  // half of the shares send by that party (in this case, shares belonging to the values in the tables)
  // The second time this is called for that party id, <jiff>.share() will sync up with the second
  // half of said shares, which correspond to the *squares* of each value in the tables.
  // CAREFUL: If this function is called more times, the shares will fail to resolve, as they do not correspond to
  // any actual shares sent out by the clients, the returned result promises will never resolve.
  var sumTables = async function (jiff_instance, partyIDs, ordering, batch) {
    // Precondition: partyIDs.length > 0
    var result = [];
    var promises = [];
    for (var k = 0; k < ordering.tables.length; k++) {
      var subid = partyIDs[0];

      // either the value corresponding to the cell matching ordering.tables[k]
      // or the value of its square, depending on whether this is the first call
      // to sumTables that include subid, or the second, respectively.
      var sum = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];

      // Sum over all parties values for this cell
      for (var p = 1; p < partyIDs.length; p++) {
        subid = partyIDs[p];
        var share = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];
        sum = sum.sadd(share);
      }

      // only open to the analyst
      var promise = jiff_instance.open(sum, [1]);
      if (jiff_instance.id === 1) {
        promise = promise.then(function (k, res) {
          result[k] = res;
        }.bind(null, k));
        promises.push(promise);
      }

      if (k % batch === 0) {
        await Promise.all(promises);
        promises = [];
        console.log(k, '/ 640');
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    return result;
  };

  // Compute the function over question data under MPC for a single cohort
  // similar to sumTable but for questions
  var sumQuestions = function (jiff_instance, partyIDs, ordering) {
    var result = [];
    for (var k = ordering.tables.length; k < ordering.tables.length + ordering.questions.length; k++) {
      var subid = partyIDs[0];

      // sum across parties for option k
      var sum = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];
      for (var p = 1; p < partyIDs.length; p++) {
        subid = partyIDs[p];
        var share = jiff_instance.share(null, null, [1, 's1'], [subid])[subid];
        sum = sum.sadd(share);
      }

      // only open to analyst
      var promise = jiff_instance.open(sum, [1]);
      if (jiff_instance.id === 1) {
        result.push(promise);
      }
    }

    return Promise.all(result);
  };

  // Compute MPC usability function over all cohorts
  var computeUsability = async function (jiff_instance, allIds, ordering) {
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

      var opened = await jiff_instance.open(entry_sum, [1]);
      if (jiff_instance.id === 1) {
        result.push(opened);
      }
    }

    return result;
  };

  // Perform MPC computation for averages, deviations, questions, and usability
  var compute = async function (jiff_instance, submitters, ordering) {
    console.time('STARTING');
    // Compute these entities in order
    var sums, squaresSums, questions, usability;

    // temporary promises
    var cohort, i;

    // Compute sums of values in table
    sums = {};
    for (i = 0; i < submitters['cohorts'].length; i++) {
      cohort = submitters['cohorts'][i];
      sums[cohort] = await sumTables(jiff_instance, submitters[cohort], ordering, 25);
      console.log('cohort', cohort);
    }

    // Sum all squares for ALL participants from all cohorts
    squaresSums = await sumTables(jiff_instance, submitters['all'], ordering, 5);

    // Sum questions options per cohort
    questions = {};
    for (i = 0; i < submitters['cohorts'].length; i++) {
      cohort = submitters['cohorts'][i];
      questions[cohort] = await sumQuestions(jiff_instance, submitters[cohort], ordering);
    }

    // Compute usability
    usability = await computeUsability(jiff_instance, submitters['all'], ordering);
    console.timeEnd('STARTING');

    // Put results in object
    return {
      sums: sums,
      squaresSums: squaresSums,
      questions: questions,
      usability: usability
    };
  };

  // Return format:
  // {
  //   averages: { <cohort number>: { table name: { table row: { table col: average } } }, ..., 'total': { same format but for all cohorts } }
  //   deviations: { 'all': { table_name: { table row: { table col: deviation ... } ... } ... } }  no cohort, object has results for all cohorts
  //   questions: { <cohort number>: { question text: { questions option: count } }, ..., 'total': { same format but for all cohorts } }
  //   usability: { metrics_object ...  no cohorts, the object is immediate for all cohorts }
  // }
  // Params:
  //    result: same result returned by compute()
  //    submitters: maps cohort ids (and 'all') to corresponding party ids
  //    ordering: result of consistentOrdering()
  var format = function (result, submitters, ordering) {
    var averages = {};
    var deviations = {};
    var questions = {};
    var usability = {};

    // Compute averages per cohort and for all parties
    for (var i = 0; i < ordering.tables.length; i++) {
      var table = ordering.tables[i].table;
      var row = ordering.tables[i].row;
      var col = ordering.tables[i].col;

      var totalMean = 0; // mean for cell for ALL cohorts
      for (var j = 0; j < submitters['cohorts'].length; j++) {
        var cohort = submitters['cohorts'][j];

        // Compute mean/average
        var cohortMean = result.sums[cohort][i];
        totalMean = cohortMean.add(totalMean);
        cohortMean = cohortMean.div(submitters[cohort].length);

        setOrAssign(averages, [cohort, table, row, col], cohortMean.toFixed(2));
      }

      totalMean = totalMean.div(submitters['all'].length);
      setOrAssign(averages, ['all', table, row, col], totalMean);
    }

    // Compute deviations for all parties together
    for (i = 0; i < ordering.tables.length; i++) {
      table = ordering.tables[i].table;
      row = ordering.tables[i].row;
      col = ordering.tables[i].col;

      var totalDeviation = result.squaresSums[i];
      totalMean = averages['all'][table][row][col];
      averages['all'][table][row][col] = averages['all'][table][row][col].toFixed(2);

      totalDeviation = totalDeviation.div(submitters['all'].length); // average of squares
      totalDeviation = totalDeviation.minus(totalMean.pow(2)); // minus square of average
      totalDeviation = totalDeviation.sqrt(); //sqrt

      setOrAssign(deviations, [table, row, col], totalDeviation.toFixed(2));
    }
    deviations = {all: deviations};

    // format questions as questions[<cohort>][<question>][<option>] = count of parties that choose this option
    for (i = 0; i < ordering.questions.length; i++) {
      var question = ordering.questions[i].question; // question title
      var label = ordering.questions[i].label; // option label/title

      var totalOptionCount = 0;
      for (j = 0; j < submitters['cohorts'].length; j++) {
        cohort = submitters['cohorts'][j];

        // Format option count and sum it across cohorts
        var cohortOptionCount = result.questions[cohort][i];
        totalOptionCount = cohortOptionCount.add(totalOptionCount);

        setOrAssign(questions, [cohort, question, label], cohortOptionCount.toString());
      }

      setOrAssign(questions, ['all', question, label], totalOptionCount.toString());
    }

    // format usability as usability[<metric>][<field>] = value
    for (i = 0; i < ordering.usability.length; i++) {
      var metric = ordering.usability[i].metric;
      var field = ordering.usability[i].field;
      var value = result.usability[i];
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
