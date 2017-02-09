/***************************************************************
 *
 * client/script/ssCreate.js
 *
 * Creates a spreadsheet that is obfuscated with random numbers.
 * Dependancies: Handsontable.js, underscore.js, jquery
 * Author: Eric Dunton
 *
 */

var validateSum = function(enteredSum, values) {
  // TODO: explicitly check if ...
  // check 
  for (var i = 0; i < values.length; i++) {
    if (isNaN(values[i])) {
      return false;
    }
  }
  if (isNaN(enteredSum)) {
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

  if (!Number.isInteger(enteredSum)) enteredSum = 0;
  
  return rowSum === enteredSum;
};

// TODO: add validator to mark large values, also greater equal 0
var makeTable = function (divID, tableConfig) {
  var hotElement = document.querySelector(divID);
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
      var col = this.propToCol(prop),
          totalsColIdx = tableConfig.numCols - 1,
          totalsRowIdx = tableConfig.numRows - 1;
      // TODO: add comments
      // TODO: don't forget '1' type entries
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
    }
  };
  var hot = new Handsontable(hotElement, hotSettings);
  return {table: hot, rowKeys: tableConfig.rowKeys, colKeys: tableConfig.colKeys};
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

var multipleChoiceToJson = function (forms, prefix) {
  var jsonData = {};
  
  forms.each(function () {
    $this = $(this);
    $label = $('label[for="' + $this.attr('id') + '"]');
    var questionText = $label.text();
    $this.find(':input').each(function () {
      var check = $(this).is(":checked"),
          val = $(this).val(),
          key = "question" + "_" + questionText + "_" + val;
      jsonData[key] = check ? 1 : 0;
    });
  });
  
  console.log(jsonData);
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

var revalidateAll = function (mainHot, $questions, $verify, callb) {
  mainHot.validateCells(function (valid) {
    var questionsCompleted = checkQuestions($questions);
    callb(valid && $verify.is(":checked") && questionsCompleted);
  });
};

// TODO: long term, figure out a way to generalize this
var submissionHandling = function (inputSources, targetUrl) {
  // Input sources
  var mainSection = inputSources['main'],
      mainHot = mainSection.table,
      mainRowKeys = mainSection.rowKeys,
      mainColKeys = mainSection.colKeys;

  var $questions = inputSources['question'];

  // Submission and verification elements
  var $verifyBox = $('#verify'),
      $submitButton = $('#submit');

  // Add listeners to radio buttons to uncheck verify box
  // when changed
  // TODO: probably shouldn't be on a per-button basis
  $questions.each(function () {
    $(this).find(':input').each(function () {
      $(this).click(function () {
        $verifyBox.prop('checked', false);
        $submitButton.prop('disabled', true);
      });
    });
  });

  // Verify checkbox listener to toggle submit button
  $verifyBox.click(function () {
    if ($(this).is(":checked")) {
      // revalidate all inputs
      revalidateAll(mainHot, $questions, $verifyBox, function (valid) {
        if (!valid) {
          alert('Input not valid. Please check again!')
          $verifyBox.prop('checked', false);
        }
        $submitButton.prop('disabled', !valid);
      });
    }
    else {
      // If unchecked, we don't need to revalidate
      // just disable submission button
      $submitButton.prop('disabled', false);
    }
  });
  
  $submitButton.click(function() {
    waitingDialog.show('Loading Data',{dialogSize: 'sm', progressType: 'warning'});
    var sessionstr = $('#sess').val().trim();
    var emailstr = $('#emailf').val().trim();

    if (!sessionstr.match(/[0-9]{7}/)){
      alert("invalid session number: must be 7 digit number");
      waitingDialog.hide();
      return;
    }

    if (!emailstr.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)){
      alert("Did not type a correct email address");
      waitingDialog.hide();
      return;
    }

    revalidateAll(mainHot, $questions, $verifyBox, function (valid) {
      if (valid) {
        var sessionID = parseInt(sessionstr);
        $.ajax({
          type: "POST",
          url: "/publickey",
          contentType: "application/json",
          data: JSON.stringify({session: sessionID}),
          dataType: "text"
        }).then(function (publickey) {
          var questionJson = multipleChoiceToJson($questions, "question"),
              mainJson = tableToJson(mainHot, "main", mainRowKeys, mainColKeys), 
              allJson = Object.assign(mainJson, questionJson),
              maskObj = genMask(Object.keys(allJson)),
              encryptedMask = encryptWithKey(maskObj, publickey);

          console.log("public key: ");
          console.log(publickey);
          console.log('data: ', allJson);

          // TODO: modular addition
          for (var k in allJson) {
            allJson[k] += maskObj[k];
          }
          console.log('masked data: ', allJson);
          console.log('encrypted mask: ', encryptedMask);

          // Instead of submitting email in the clear
          // we will submit a hash
          var md = forge.md.sha1.create();
          md.update(emailstr);
          var emailHash = md.digest().toHex().toString();

          var sendData = {
            data: allJson,
            mask: encryptedMask,
            user: emailHash,
            session: sessionID
          };

          return $.ajax({
            type: "POST",
            url: targetUrl,
            data: JSON.stringify(sendData),
            contentType: 'application/json'
          });
        }).then(function (response) {
          console.log('reponse: ', response);
          alert("Submitted data.");
          waitingDialog.hide();
          return response;
          // TODO: change to catch with new jquery
        }).fail(function (err) {
          console.log(err);
          if (err && err.hasOwnProperty('responseText')) {
            alert(err.responseText);
          } 
          else {
            alert('Error! Please verify submission and try again.');
          }
          waitingDialog.hide();
        });
      }
      else {
        alert("Invalid Spreadsheet:\nplease ensure all fields are filled out correctly");
        waitingDialog.hide();
      }
    });
  });
};

// creates propertes of a blank cell
function makeBlank(instance, td, row, col, prop, value, cellProperties) {
  td.style.color = 'grey';
  td.style.background = 'grey';
}

function outsideRangeRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);
  td.style.background = '#f0e68c';
}

function normalRangeRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);
  td.style.background = '#fff';
}

// generates array of random numbers
function secureRandom(size){
  var array = new Uint32Array(size);
  var cryptoObj = window.crypto || window.msCrypto; // IE 11 fix
  cryptoObj.getRandomValues(array);
  return array;
}

// creates random mask
function genMask(keys){
  return _.object(keys, secureRandom(keys.length));
}

function encryptWithKey(obj, key) {
  var pki = forge.pki;
  var publicKey = pki.publicKeyFromPem(key);

  return _.mapObject(obj, function(x,k) {
    return publicKey.encrypt(x.toString(), 'RSA-OAEP', {
      md: forge.md.sha256.create()
    })
  });
}

/*eof*/
