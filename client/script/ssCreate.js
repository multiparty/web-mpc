/***************************************************************
 *
 * client/script/ssCreate.js
 *
 * Creates a spreadsheet that is obfuscated with random numbers.
 * Dependancies: Handsontable.js, underscore.js, jquery
 * Author: Eric Dunton
 *
 */

var UNCHECKED_ERR = 'Please acknowledge that all data is correct and verified.',
    ADD_QUESTIONS_ERR = 'Please answer all Additional Questions.',
    NUM_EMP_INVALID_ERR = 'Please double-check the Number of Employees spreadsheet.',
    NUM_EMP_EMPTY_ERR = 'Please fill out the Number of Employees spreadsheet.',
    BOARD_INVALID_ERR = 'Please double-check the Board of Directors spreadsheet \n' +
                        'or uncheck the Provide Board of Directors Information checkbox.',
    BOARD_EMPTY_ERR = 'Please fill out the Board of Directors spreadsheet \n' + 
                      'or uncheck the Provide Board of Directors Information checkbox.',
    GENERIC_SUBMISSION_ERR = 'Something went wrong with submission! Please try again.';

var emptyOrPosInt = function (val) {
  return val == null || val === '' || (Number.isInteger(val) && val >= 0);
};

var validateSum = function(enteredSum, values) {
  for (var i = 0; i < values.length; i++) {
    if (!emptyOrPosInt(values[i])) {
      return false;
    }
  }
  if (!emptyOrPosInt(enteredSum)) {
    return false;
  }

  var rowSum = values.map(function (val) {
    if (!Number.isInteger(val)) {
      return 0;
    }
    else {
      return val;
    }
  }).reduce(function(e1, e2) {
    return e1 + e2;
  });

  if (!Number.isInteger(enteredSum)) {
    enteredSum = 0;
  }

  return rowSum === enteredSum;
};

var wholePositiveValidator = function (value, callback) {
  if (value == null || value === '') {
    callback(true);
  }
  else {
    callback(/^0$|^[1-9]\d*$/.test(value));
  }
};

var makeTable = function (divID, tableConfig) {
  var hotElement = document.querySelector(divID);
  // ugly workaround because we can only set a validator on the column level
  var colsWithValidator = tableConfig.columns.forEach(function (col) {
    col.validator = wholePositiveValidator;
  });
  var hotSettings = {
    width: 1024,
    columns: tableConfig.columns,
    rowHeaders: tableConfig.rowHeaders,
    nestedHeaders: tableConfig.nestedHeaders,
    maxRows: tableConfig.numRows,
    maxCols: tableConfig.numCols,
    afterChange: function (changes, source) {
      $('#verify').prop('checked', false);
      $('#submit').prop('disabled', true);
      this.validateCells();
    },
    afterValidate: function (isValid, value, row, prop, source) { 
      if (!isValid) {
        return false;
      }
      var col = this.propToCol(prop),
          totalsColIdx = tableConfig.numCols - 1,
          totalsRowIdx = tableConfig.numRows - 1;
      
      if (col === totalsColIdx && row < totalsRowIdx) {
        var rowValues = this.getData(row, 0, row, col - 1)[0];
        return validateSum(value, rowValues);
      }
      else if (row === totalsRowIdx && col !== totalsColIdx) {
        var colValues = this.getData(0, col, row - 1, col).map(function (val) {
          return val[0];
        });
        return validateSum(value, colValues);
      }
      else if (row === totalsRowIdx && col === totalsColIdx) {
        var rowValues = this.getData(row, 0, row, col - 1)[0];
        var colValues = this.getData(0, col, row - 1, col).map(function (val) {
          return val[0];
        });
        return validateSum(value, rowValues) 
          && validateSum(value, colValues);
      }
    },
    beforeChange: function (changes, source) {
      // Workaround for handsontable undo issue
      if (this.readOnly) {
        return false;
      }
    },
    cells: function (row, col, prop) {
      var cellProperties = {},
          isReadOnly = this.instance.getSettings().readOnly;

      if (isReadOnly) {
        cellProperties.renderer = makeBlank;
      }
      else {
        var value = this.instance.getDataAtCell(row, col);
        if (value > 10000) {
          cellProperties.renderer = outsideRangeRenderer;
        }
        else {
          cellProperties.renderer = Handsontable.renderers.NumericRenderer;
        }
      }

      return cellProperties;
    }
  };
  var hot = new Handsontable(hotElement, hotSettings);
  return {
    table: hot, 
    rowKeys: tableConfig.rowKeys, 
    colKeys: tableConfig.colKeys
  };
};

// pre-condition: all data is valid. only call this *after* validation
var tableToJson = function (hot, prefix, rowKeys, colKeys) {
  var data = hot.getData(),
      jsonData = {};

  data.forEach(function (row, rowIdx) {
    row.forEach(function (element, colIdx) {
      var rowKey = rowKeys[rowIdx],
          colKey = colKeys[colIdx],
          key = prefix + "_" + rowKey + "_" + colKey;

      // Convert all null and empty string entries to 0
      if (!Number.isInteger(element)) {
        jsonData[key] = 0;
      }
      else {
        jsonData[key] = element;
      }
    });
  });

  return jsonData;
};

var multipleChoiceToJson = function ($forms, prefix) {
  var jsonData = {};
  
  $forms.each(function () {
    $this = $(this);
    var questionText = $.trim($this.find("#question-text").text());
    $this.find(':input').each(function () {
      var check = $(this).is(":checked"),
          val = $(this).val(),
          key = prefix + "_" + questionText + "_" + val;
      jsonData[key] = check ? 1 : 0;
    });
  });
  
  console.log(jsonData);
  return jsonData;
};

var checkboxToJson = function ($checkbox, prefix) {
  var jsonData = {};

  var optionText = $.trim($checkbox.closest('label').text()),
      checked = $checkbox.is(':checked');

  [['Yes', checked], ['No', !checked]].forEach(function (option) {
    var key = prefix + "_" + optionText + "_" + option[0];
    jsonData[key] = option[1] ? 1 : 0;
  });

  return jsonData;
};

var checkQuestions = function (forms) {
  var checked = true;

  forms.each(function () {
    $this = $(this);
    var numberChecked = 0;
    $this.find(':input').each(function () {
      var value = $(this).is(":checked");
      numberChecked += value ? 1 : 0;
    });
    // could rewrite as for loop to return here
    // if false
    checked = checked && (numberChecked === 1);
  });

  return checked;
};

// Sadly, there doesn't seem to be an easier way to do this...
var isTableEmpty = function (hot) {
  var numEmptyRows = hot.countEmptyRows(),
      numEmptyCols = hot.countEmptyCols(),
      numTotalRows = hot.countRows(),
      numTotalCols = hot.countCols();
  return (numTotalRows === numEmptyRows) && 
         (numTotalCols === numEmptyCols);
}

// REVIEW
var revalidateAll = function (
  mainHot, 
  boardHot, 
  $boardBox, 
  $questions, 
  $verify, 
  callb
) {
  var verifyChecked = $verify.is(':checked'),
      questionsValid = checkQuestions($questions);

  if (!verifyChecked) {
    return callb(false, UNCHECKED_ERR);
  }

  if (!questionsValid) {
    return callb(false, ADD_QUESTIONS_ERR);
  }

  mainHot.validateCells(function (mainValid) {
    if (!mainValid) {
      return callb(false, NUM_EMP_INVALID_ERR);
    }

    if (isTableEmpty(mainHot)) {
      return callb(false, NUM_EMP_EMPTY_ERR);
    }

    if ($boardBox.is(':checked')) {
      boardHot.validateCells(function (boardValid) {
        if (!boardValid) {
          return callb(false, BOARD_INVALID_ERR);
        }
        if (isTableEmpty(boardHot)) {
          return callb(false, BOARD_EMPTY_ERR);
        }
        return callb(boardValid);
      });
    }
    else {
      return callb(mainValid);
    }
  });
};

var submitAll = function (sessionstr, emailstr, targetUrl, inputSources, la) {
  // Start loading animation
  la.start();
  
  // Unpack input sources
  var mainSection = inputSources['main'],
      mainHot = mainSection.table,
      mainRowKeys = mainSection.rowKeys,
      mainColKeys = mainSection.colKeys;

  var boardSection = inputSources['board'],
      boardHot = boardSection.table,
      boardRowKeys = boardSection.rowKeys,
      boardColKeys = boardSection.colKeys;
  var $boardBox = $('#include-board');

  var $questions = inputSources['question'];

  $.ajax({
    type: "POST",
    url: "/publickey",
    contentType: "application/json",
    data: JSON.stringify({session: sessionstr}),
    dataType: "text"
  }).then(function (publickey) {
    // Flattened input in the form of key-value pairs
    var keyValuePairs = Object.assign(
      multipleChoiceToJson($questions, "question"), 
      tableToJson(mainHot, "main", mainRowKeys, mainColKeys), 
      tableToJson(boardHot, "board", boardRowKeys, boardColKeys), 
      checkboxToJson($boardBox, "includeBoard")
    );

    // Secret-share the value in each key-value pair
    var secretShared = secretShareValues(keyValuePairs),
        serviceShares = secretShared.service,
        analystShares = secretShared.analyst; 

    // Encrypt analyst shares
    var encryptedAnalystShares = encryptWithKey(analystShares, publickey);

    // Hash email address for submission
    var md = forge.md.sha1.create();
    md.update(emailstr);
    var emailHash = md.digest().toHex().toString();

    // The submission to be posted to service
    var submission = {
      data: serviceShares,
      mask: encryptedAnalystShares,
      user: emailHash,
      session: sessionstr
    };

    console.log('public key:', publickey);
    console.log('submission:', submission);

    // Post submission
    return $.ajax({
      type: "POST",
      url: targetUrl,
      data: JSON.stringify(submission),
      contentType: 'application/json'
    });
  })
  .then(function (response) {
    console.log(response);
    alert("Submitted data.");
    // Stop loading animation
    la.stop();
    return response;
  })
  .catch(function (err) {
    console.log(err);
    if (err && err.hasOwnProperty('responseText')) {
      alert(err.responseText);
    } 
    else {
      alert(GENERIC_SUBMISSION_ERR);
    }
    // Stop loading animation
    la.stop();
  });
};

// TODO: long term, figure out a way to generalize this
var submissionHandling = function (inputSources, targetUrl) {
  // Input sources
  var mainSection = inputSources['main'],
      mainHot = mainSection.table,
      mainRowKeys = mainSection.rowKeys,
      mainColKeys = mainSection.colKeys;

  var boardSection = inputSources['board'],
      boardHot = boardSection.table,
      boardRowKeys = boardSection.rowKeys,
      boardColKeys = boardSection.colKeys;
  var $boardBox = $('#include-board');

  var $questions = inputSources['question'];

  // Submission and verification elements
  var $verifyBox = $('#verify'),
      $submitButton = $('#submit');

  // Listeners
  $boardBox.click(function () {
    // disable submission 
    $verifyBox.prop('checked', false);
    $submitButton.prop('disabled', true);
    if ($(this).is(':checked')) {
      // Enable table editing
      boardHot.updateSettings({
        readOnly: false
      });
    }
    else {
      // Clear all entered data
      // Disable editing
      boardHot.clear();
      boardHot.updateSettings({
        readOnly: true
      });  
    }
  });

  // Radio button listeners
  // TODO: probably shouldn't be on a per-button basis
  $questions.each(function () {
    $(this).find(':input').each(function () {
      $(this).click(function () {
        // disable submission
        $verifyBox.prop('checked', false);
        $submitButton.prop('disabled', true);
      });
    });
  });

  // Verify checkbox listener to toggle submit button
  $verifyBox.click(function () {
    if ($(this).is(":checked")) {
      // revalidate all inputs
      revalidateAll(
        mainHot,
        boardHot,
        $boardBox,
        $questions,
        $verifyBox,
        function (valid, errMsg) {
          if (valid) {
            $submitButton.prop('disabled', false);
            // $verifyBox.prop('checked', false);
          }
          else {
            alert(errMsg);
            $verifyBox.prop('checked', false);
            $submitButton.prop('disabled', true);  
          }
        }
      );
    }
    else {
      // If unchecked, we don't need to revalidate
      // just disable submission button
      $submitButton.prop('disabled', true);
    }
  });
  
  $submitButton.click(function() {
    var la = Ladda.create(this);
    // waitingDialog.show('Loading Data',{dialogSize: 'sm', progressType: 'warning'});
    var sessionstr = $('#sess').val().trim();
    var emailstr = $('#emailf').val().trim();

    if (!sessionstr.match(/^[a-z0-9]{32}$/)){
      alert("Invalid session number: must be 32 character combination of letters and numbers");
      return;
    }

    if (!emailstr.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)){
      alert("Did not type a correct email address");
      return;
    }

    revalidateAll(
      mainHot,
      boardHot,
      $boardBox,
      $questions,
      $verifyBox,
      function (valid, errMsg) {
        if (valid) {
          submitAll(
            sessionstr,
            emailstr,
            targetUrl,
            inputSources,
            la
          );
        }
        else {
          alert(errMsg);
          la.stop();
        }
      }
    );
  });
};

function makeBlank(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);
  td.style.background = '#f3f3f3';
}

function outsideRangeRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);
  td.style.background = '#ffff00';
}

function encryptWithKey (obj, key) {
  var pki = forge.pki;
  var publicKey = pki.publicKeyFromPem(key);

  return _.mapObject(obj, function(x,k) {
    return publicKey.encrypt(x.toString(), 'RSA-OAEP', {
      md: forge.md.sha256.create()
    })
  });
}
