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

  // the size of the first table cells
  const EMPLOYEES_NUMBER_TABLE_SIZE = 160;

  var updateProgress = function (progressBar, percentage) {
    if (progressBar) {
      var percentageString = Math.floor(percentage * 100) + '%';
      progressBar.style.width = percentageString;
      progressBar.innerHTML = percentageString;
    }
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

    var table_rows_count, table_cols_count;
    // order tables
    for (var i = 0; i < table_template.tables.length; i++) {
      var table_def = table_template.tables[i];
      if (table_def.submit === false) {
        continue;
      }

      var rows = table_def.rows;
      var cols = table_def.cols[table_def.cols.length - 1];
      table_rows_count = rows.length;
      table_cols_count = cols.length;
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

    return { tables: tables, questions: questions, usability: usability, table_rows_count: table_rows_count, table_cols_count: table_cols_count };
  };

  // Get all the shares that a party have shared
  var getShares = function (jiff_instance, partyID, ordering) {
    var result = {
      shares: [],
      squares: [],
      questions: [],
      usability: []
    };

    for (var k = 0; k < 2 * ordering.tables.length + ordering.questions.length + ordering.usability.length; k++) {
      var share =  jiff_instance.share(null, null, [1, 's1'], [partyID])[partyID];
      if (k < ordering.tables.length) {
        result.shares.push(share);
      } else if (k < 2 * ordering.tables.length) {
        result.squares.push(share);
      } else if (k < 2 * ordering.tables.length + ordering.questions.length) {
        result.questions.push(share);
      } else {
        result.usability.push(share);
      }
    }
    return result;
  };

  // Sum the given two arrays of secret shares placing the result in the first array
  var sumAndAccumulate = function (accumulator, shares) {
    if (accumulator == null || accumulator.length === 0) {
      return shares.slice();
    }

    for (var i = 0; i < accumulator.length; i++) {
      accumulator[i] = accumulator[i].sadd(shares[i]);
    }
    return accumulator;
  };

  // Sum the given two arrays of secret shares, placing the result in the first array
  // This is for cohorts: the accumulator is only grouped by gender and level, while the input
  // array has all groupings.
  var sumAndAccumulateCohort = function (accumulator, shares, ordering) {
    if (accumulator == null) {
      accumulator = [];
    }

    for (var i = 0; i < shares.length; i++) {
      var row = Math.floor(i / ordering.table_cols_count);
      var colMod2 = (i % ordering.table_cols_count) % 2; // 0 => female, 1 => male
      var index = 2*row + colMod2;
      if (accumulator[index]) {
        accumulator[index] = accumulator[index].sadd(shares[i]);
      } else {
        accumulator[index] = shares[i];
      }
    }

    return accumulator;
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
      if (i % EMPLOYEES_NUMBER_TABLE_SIZE === 0) {
        // exceptions does not really have indices, but relative indices within a table, since we have 3 consecutive tables
        // this means relative index is not really sorted, but forms 3 consecutive sorted sequences.
        exceptionsIndex = 0;
      }

      if (exceptions.length > 0 && exceptions[exceptionsIndex] === i % EMPLOYEES_NUMBER_TABLE_SIZE) {
        promises.push('-');
        exceptionsIndex++;
      } else {
        var promise = jiff_instance.open(results[i], parties);
        promises.push(promise);
      }
    }

    return Promise.all(promises);
  };

  // Returns a *sorted* array containing indices of cells which have number of employees lower than threshold
  var verifyThreshold = function (numberOfEmployees) { // unused
    var positions = [];
    for (var i = 0; i < numberOfEmployees.length; i++) {
      if (numberOfEmployees[i].lt(3)) {
        positions.push(i);
      }
    }
    return positions;
  };

  // Perform MPC computation for averages, deviations, questions, and usability
  var compute = async function (jiff_instance, submitters, ordering, progressBar) {
    updateProgress(progressBar, 0);

    // Compute these entities in order
    var sums, squaresSums = null, questions = null, usability = null;

    // Temporary variables
    var cohort, i, p, shares;
    var promises = [];
    sums = {all: null}; // sums['all'] is for everyone, sums[<cohort>] is for <cohort> only

    // Process shares from parties that do not belong to any cohort (their cohort has too few elements)
    var counter = 0;
    for (i = 0; i < submitters['none'].length; i++) {
      // Get all shares this party sent: values, squares of values, questions, and usability.
      shares = getShares(jiff_instance, submitters['none'][i], ordering);

      // Sum all things
      sums['all'] = sumAndAccumulate(sums['all'], shares.shares);
      squaresSums = sumAndAccumulate(squaresSums, shares.squares);
      questions = sumAndAccumulate(questions, shares.questions);
      usability = sumAndAccumulate(usability, shares.usability);

      // garbage
      shares = null;
      await usability[usability.length - 1].promise;

      // progress
      counter++;
      updateProgress(progressBar, (counter / submitters['all'].length) * 0.94);
    }

    // Compute all the results: computation proceeds by party in order
    for (i = 0; i < submitters['cohorts'].length; i++) {
      cohort = submitters['cohorts'][i];

      for (p = 0; p < submitters[cohort].length; p++) {
        var partyID = submitters[cohort][p];

        // Get all shares this party sent: values, squares of values, questions, and usability.
        shares = getShares(jiff_instance, partyID, ordering);

        // Sum all things
        sums[cohort] = sumAndAccumulateCohort(sums[cohort], shares.shares, ordering);
        sums['all'] = sumAndAccumulate(sums['all'], shares.shares);
        squaresSums = sumAndAccumulate(squaresSums, shares.squares);
        questions = sumAndAccumulate(questions, shares.questions);
        usability = sumAndAccumulate(usability, shares.usability);

        // garbage
        shares = null;
        await usability[usability.length - 1].promise;

        // progress
        counter++;
        updateProgress(progressBar, (counter / submitters['all'].length) * 0.94);
      }

      // Cohort averages are done, open them (do not use await so that we do not block the main thread)
      var promise = openValues(jiff_instance, sums[cohort], [1]);
      promises.push(promise);
    }

    // wait for cohort outputs
    var cohortOutputs = await Promise.all(promises);
    updateProgress(progressBar, 0.96);
    for (i = 0; i < submitters['cohorts'].length; i++) {
      console.log(i, submitters['cohorts'][i]);
      sums[submitters['cohorts'][i]] = cohortOutputs[i];
    }

    // Open all sums and sums of squares
    sums['all'] = await openValues(jiff_instance, sums['all'], [1]);
    squaresSums = await openValues(jiff_instance, squaresSums, [1]);
    updateProgress(progressBar, 0.98);

    // Open questions and usability
    questions = await openValues(jiff_instance, questions, [1]);
    usability = await openValues(jiff_instance, usability, [1]);
    updateProgress(progressBar, 1);

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

    // Compute averages per cohort
    var cols = ordering.table_cols_count;
    const EMPLOYEES_NUMBER_COHORT_TABLE_SIZE = 2 * Math.floor(EMPLOYEES_NUMBER_TABLE_SIZE / cols);
    for (var c = 0; c < submitters['cohorts'].length; c++) {
      var cohort = submitters['cohorts'][c];

      for (var i = 0; i < result.sums[cohort].length; i++) {
        var rowIndex = Math.floor(i / 2);
        var table = ordering.tables[rowIndex * cols].table;
        var row = ordering.tables[rowIndex * cols].row;
        var col = (i % 2) === 0 ? 'Female' : 'Male';

        var cohortMean = result.sums[cohort][i];
        if (i >= EMPLOYEES_NUMBER_COHORT_TABLE_SIZE) {
          cohortMean = cohortMean.div(result.sums[cohort][i % EMPLOYEES_NUMBER_COHORT_TABLE_SIZE]);
        }

        setOrAssign(averages, [cohort, table, row, col], cohortMean.toFixed(2));
      }
    }

    // Compute averages and deviations for all parties
    for (i = 0; i < ordering.tables.length; i++) {
      table = ordering.tables[i].table;
      row = ordering.tables[i].row;
      col = ordering.tables[i].col;

      // Compute average
      var totalMean = result.sums['all'][i]; // mean for cell for ALL cohorts
      if (i >= EMPLOYEES_NUMBER_TABLE_SIZE) {
        totalMean = totalMean.div(result.sums['all'][i % EMPLOYEES_NUMBER_TABLE_SIZE]);
      }

      setOrAssign(averages, ['all', table, row, col], totalMean.toFixed(2));

      // Compute deviation for population of values presented by companies (not for individual employees)
      // E[X^2]
      var avgOfSquares = result.squaresSums[i];
      avgOfSquares = avgOfSquares.div(submitters['all'].length);
      // (E[X])^2
      var squareOfAvg = result.sums['all'][i].div(submitters['all'].length);
      squareOfAvg = squareOfAvg.pow(2);
      // deviation formula: E[X^2] - (E[X])^2
      var totalDeviation = avgOfSquares.minus(squareOfAvg);
      totalDeviation = totalDeviation.sqrt(); //sqrt

      setOrAssign(deviations, [table, row, col], totalDeviation.toFixed(2));
    }
    deviations = {all: deviations};

    // format questions as questions[<cohort>][<question>][<option>] = count of parties that choose this option
    for (i = 0; i < ordering.questions.length; i++) {
      var question = ordering.questions[i].question; // question title
      var label = ordering.questions[i].label; // option label/title

      var totalOptionCount = 0;
      for (var j = 0; j < submitters['cohorts'].length; j++) {
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
