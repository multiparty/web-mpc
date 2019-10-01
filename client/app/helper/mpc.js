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

    return { tables: tables, questions: questions, usability: usability };
  };

  // Sets up the shares that were received from the given parties
  // and sums them cell-wise.
  // This works the following way: we loop over every cell, for each cell
  // we acquire the share sent by the first party, and use it as an accumulator,
  // adding it with the share received from the next party, until all shares are summed.
  // The final cell result is saved, and we move to the next cell.
  // This is done in this order to reduce memory foot-print. The maximum number of shares
  // kept in memory is $n$+1, where $n$ is the number of cells.
  // The other obvious implementation where we loop over parties and then cells, may cause
  // up to $n+p+1$ shares at one point if implemented *smartly* using in place accumulators,
  // or even $n*p$ if implemented in a dumb way, where $p$ is the number of submitters.
  var shareAndSum = function (jiff_instance, partyIDs, ordering) {
    // Precondition: partyIDs.length > 0
    var result = [];
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

      result.push(sum);
    }

    return result;
  };

  // Sums the results from two cohorts cell-wise, returns secret shares of the results
  // In reality, this is used in a way similar to a .reduce() function
  // Results from th first two cohorts are summed together, then the sum is added to the results from
  // the third cohort, then forth, etc
  // This is implemented pairwise as opposed to in one shot, because this has a lower memory footprint.
  // At any stage, we need to keep $n$ shares for the accumulator and $n$ shares for the next cohort,
  // where $n$ is the number of cells in the tables, instead of keeping $p*n$ shares when done in one
  // shot where $p$ is the number of submitters.
  var sumCohortPair = function (resultCohort1, resultCohort2) {
    if (resultCohort2 == null) {
      return resultCohort1;
    }
    // Assertion: resultCohort1.length == result.Cohort2.length
    var result = [];
    for (var i = 0; i < resultCohort1.length; i++) {
      result.push(resultCohort1[i].sadd(resultCohort2[i]));
    }
    return result;
  };

  // Opens the shares corresponding to the logical slice results[rangeStart:rangeEnd) to the specified parties.
  // The slice is logical, no copies of arrays are created.
  // The returned result is a promise to an array of size (rangeEnd-rangeStart) containing
  // the opened results in order. Unless the caller is not specified as one of the result receiving parties
  // in which case the returned value is a promise to a bunch of nulls.
  // if rangeStart and/or rangeEnd is not provided, they default to 0 and length respectively.
  // Exceptions is a sorted array of positions to ignore, these positions are not opened, and instead
  // a value of '-' is returned for them. Exceptions defaults to [] if not provided.
  var openValues = function (jiff_instance, results, parties, rangeStart, rangeEnd, exceptions) {
    if (rangeStart == null) {
      rangeStart = 0;
    }
    if (rangeEnd == null) {
      rangeEnd = results.length;
    }
    if (exceptions == null) {
      exceptions = [];
    }

    var promises = [];
    var exceptionsIndex = 0; // keeps track of the next exception, fast way to check set membership since both set and values are sorted
    for (var i = rangeStart; i < rangeEnd; i++) {
      if (i % 160 === 0) {
        // exceptions does not really have indices, but relative indices within a table, since we have 3 consecutive tables
        // this means relative index is not really sorted, but forms 3 consecutive sorted sequences.
        exceptionsIndex = 0;
      }

      if (exceptions.length > 0 && exceptions[exceptionsIndex] === i % 160) {
        promises.push('-'); // TODO: ensure Promise.all([<promise>, <value>, ...].then(function ([<value of promise>, <value>, ...])) is supported accross majority of browsers
        exceptionsIndex++;
      } else {
        var promise = jiff_instance.open(results[i], parties);
        promises.push(promise);
      }
    }

    return Promise.all(promises);
  };

  // Returns a *sorted* array containing indices of cells which have number of employees lower than threshold
  var verifyThreshold = function (numberOfEmployees) {
    var positions = [];
    for (var i = 0; i < numberOfEmployees.length; i++) {
      if (numberOfEmployees[i].lt(3)) {
        positions.push(i);
      }
    }
    return positions;
  };

  // Executes the protocol for computing the tables sums for a single cohort
  // For a single cohort, we do not compute any standard deviations (so as not to reveal too much information)
  // We also check that every group (seniority level /\ gender /\ ethnicity) in this cohort has at least *threshold*
  // many employees, otherwise, all non-employee-count information about that group is kept hidden and not opened.
  var computeCohort = function (jiff_instance, partyIDs, ordering) {
    // compute the sum for every cell in all 4 tables for this cohort without opening result.
    var sums = shareAndSum(jiff_instance, partyIDs, ordering);

    var promise = new Promise(function (resolve) {
      // open the number of employees to both analyst and server.
      var promise = openValues(jiff_instance, sums, [1, 's1'], 0, 160);
      promise.then(function (numberOfEmployees) {
        // find cells with lower number than threshold
        var exceptions = verifyThreshold(numberOfEmployees);

        // open everything except bad cells, but only to the analyst
        var promise = openValues(jiff_instance, sums, [1], 160, sums.length, exceptions);
        promise.then(function (remainingValues) {
          var result = numberOfEmployees; // just an alias
          // concat number of employees and the remaining values
          for (var i = 0; i < remainingValues.length; i++) {
            result.push(remainingValues[i]); // fast than .concat and less memory (in place)
          }

          // return final result
          resolve(result);
        });
      });
    });

    return {
      sumResults: promise,
      // needed for other parts of the computation, cannot always rely on opened result because of exceptions/threshold
      sumShares: sums
    }
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

  // Perform MPC computation for averages, deviations, questions, and usability
  var compute = function (jiff_instance, submitters, ordering) {
    // Compute these entities in order
    var sums, squaresSums, questions, usability;

    // temporary promises
    var promises = [];
    var promise, cohort, i;

    // Compute sums of values in table
    sums = {all: null}; // sums['all'] is for everyone, sums[<cohort>] is for <cohort> only
    for (i = 0; i < submitters['cohorts'].length; i++) {
      cohort = submitters['cohorts'][i];
      // Compute result per cohort, keep shares to accumulate to compute total ('all') result
      var cohortResult = computeCohort(jiff_instance, submitters[cohort], ordering);
      // accumulate total results
      sums['all'] = sumCohortPair(cohortResult.sumShares, sums['all']);
      // store per-cohort results
      promises.push(cohortResult.sumResults.then(function (cohort, result) {
        sums[cohort] = result;
      }.bind(null, cohort)));
    }

    // Store total sums for all cohorts
    promise = openValues(jiff_instance, sums['all'], [1]);
    promises.push(promise.then(function (result) {
      sums['all'] = result;
    }));

    // Sum all squares for ALL participants from all cohorts
    var squaresSumsShares = shareAndSum(jiff_instance, submitters['all'], ordering);
    promise = openValues(jiff_instance, squaresSumsShares, [1]);
    promises.push(promise.then(function (result) {
      squaresSums = result;
    }));

    // Sum questions options per cohort
    questions = {};
    for (i = 0; i < submitters['cohorts'].length; i++) {
      cohort = submitters['cohorts'][i];
      promise = sumQuestions(jiff_instance, submitters[cohort], ordering);
      promises.push(promise.then(function (cohort, result) {
        questions[cohort] = result;
      }.bind(null, cohort)));
    }

    // Compute usability
    promise = computeUsability(jiff_instance, submitters['all'], ordering);
    promises.push(promise.then(function (result) {
      usability = result;
    }));

    // Put results in object
    return Promise.all(promises).then(function () {
      return {
        sums: sums,
        squaresSums: squaresSums,
        questions: questions,
        usability: usability
      };
    });
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

    // Compute averages per cohort
    for (var i = 0; i < ordering.tables.length; i++) {
      var table = ordering.tables[i].table;
      var row = ordering.tables[i].row;
      var col = ordering.tables[i].col;

      // Compute for each cohort
      for (var j = 0; j < submitters['cohorts'].length; j++) {
        var cohort = submitters['cohorts'][j];

        // Compute mean/average
        var cohortMean = result.sums[cohort][i];
        if (cohortMean !== '-') {
          cohortMean = cohortMean.div(submitters[cohort].length).toFixed(2);
        }

        setOrAssign(averages, [cohort, table, row, col], cohortMean);
      }
    }

    // Compute averages and deviations for all parties
    for (i = 0; i < ordering.tables.length; i++) {
      table = ordering.tables[i].table;
      row = ordering.tables[i].row;
      col = ordering.tables[i].col;

      // Compute for all parties
      var totalMean = result.sums['all'][i]; // mean for cell for ALL cohorts
      totalMean = totalMean.div(submitters['all'].length);
      setOrAssign(averages, ['all', table, row, col], totalMean.toFixed(2));

      var totalDeviation = result.squaresSums[i]; // deviation for cell for ALL cohorts
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
