/***************************************************************
 *
 * client/script/ssCreate.js
 *
 * Creates a spreadsheet that is obfuscated with random numbers.
 * Dependancies: Handsontable.js, underscore.js, jquery
 * Author: Eric Dunton
 *
 */

allValid = {main: false, verify: false};

var validateSum = function(enteredSum, values) {
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
      this.validateCells(function (valid) {
        if (document.querySelector('#verify').checked && valid) {
          $('#submit').prop('disabled', false);
        } else {
          $('#submit').prop('disabled', true);
        }
      });
    },
    afterValidate: function (isValid, value, row, prop, source) {
      var isChecked = document.querySelector('#verify').checked,
          col = this.propToCol(prop);
      if (isChecked) {
        if (col === tableConfig.numCols - 1
          && row < tableConfig.numRows - 1) {
          var rowValues = this.getData(row, 0, row, col - 1)[0];
          return validateSum(value, rowValues);
        }
        else if (row === tableConfig.numRows - 1 
          && col !== tableConfig.numCols - 1) {
          var colValues = this.getData(0, col, row - 1, col).map(function (val) {
            return val[0];
          });
          return validateSum(value, colValues);
        }
      }
    },
    cells: function (row, col, prop) {
      var cellProperties = {};

      if (row === tableConfig.numRows - 1 
        && col === tableConfig.numCols - 1) {
        cellProperties.readOnly = true;
      }

      return cellProperties;
    }
  };
  var hot = new Handsontable(hotElement, hotSettings);
  return {table: hot, rowKeys: tableConfig.rowKeys, colKeys: tableConfig.colKeys};
};

// pre-condition: all data is valid. only call this *after* validation
var tableToJson = function (hot, tableName, rowKeys, colKeys) {
  var data = hot.getData(),
      jsonData = {};

  data.forEach(function (row, rowIdx) {
    row.forEach(function (element, colIdx) {
      var meta = hot.getCellMeta(rowIdx, colIdx),
          rowKey = rowKeys[rowIdx],
          colKey = colKeys[colIdx],
          key = rowKey + "_" + colKey;

      // Exclude "dummy" read-only values 
      // (these correspond to the cell at row totals, col totals)
      if (!meta.readOnly) {
        // Convert all null and empty string entries to 0
        if (!Number.isInteger(element)) {
          jsonData[key] = 0;
        }
        else {
          jsonData[key] = element;
        }
      }
    });
  });

  return jsonData;
};

var initiateButton = function (tableAndKeys, url, session, email) {
  var hot = tableAndKeys.table,
      rowKeys = tableAndKeys.rowKeys,
      colKeys = tableAndKeys.colKeys;

  // Verify checkbox listener to toggle submit button
  var verifyBox = document.querySelector('#verify');
  Handsontable.Dom.addEvent(verifyBox, 'click', function (event) {
    hot.validateCells(function (valid) {
      if (verifyBox.checked && valid) {
        $('#submit').prop('disabled', false);
      } else {
        $('#submit').prop('disabled', true);
      }
    });
  });

  var submitButton = document.querySelector('#submit');
  Handsontable.Dom.addEvent(submitButton, 'click', function (event) {
    waitingDialog.show('Loading Data',{dialogSize: 'sm', progressType: 'warning'});
    var sessionstr = $('#sess').val().trim();
    var emailstr = $('#emailf').val().trim();

    if(!sessionstr.match(/[0-9]{7}/)){
      alert("invalid session number: must be 7 digit number");
      waitingDialog.hide();
      return;
    }

    if(!emailstr.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)){
      alert("Did not type a correct email address");
      waitingDialog.hide();
      return;
    }

    // TODO: make below chain more robust.
    // If anything breaks inside the then blocks, it will *not*
    // be caught and the waiting dialog hangs

    // validate table before submitting
    hot.validateCells(function (valid) {
      if (verifyBox.checked && valid) {
        var sessionID = parseInt(sessionstr);
        $.ajax({
          type: "POST",
          url: "/publickey",
          contentType: "application/json",
          data: JSON.stringify({session: sessionID}),
          dataType: "text"
        }).then(function(publickey) {
          var flat = tableToJson(hot, "", rowKeys, colKeys);
          var maskObj = genMask(Object.keys(flat)); 
          var encryptedMask = encryptWithKey(maskObj, publickey);

          console.log("public key: ");
          console.log(publickey);
          console.log('data: ', flat);

          // TODO: modular addition
          for (var k in flat) {
            flat[k] += maskObj[k];
          }
          console.log('masked data: ', flat);
          console.log('encrypted mask: ', encryptedMask);

          // Instead of submitting email in the clear
          // we will submit a hash
          var md = forge.md.sha1.create();
          md.update(emailstr);
          var emailHash = md.digest().toHex().toString();

          var sendData = {
            data: flat,
            mask: encryptedMask,
            user: emailHash,
            session: sessionID
          };

          return $.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(sendData),
            contentType: 'application/json'
          });
        }).then(function (response) {
          console.log('reponse: ', response);
          alert("Submitted data.");
          waitingDialog.hide();
          return response;
        }).fail(function (err) {
          console.log(err);
          if (err && err.hasOwnProperty('responseText')) {
            alert(err.responseText);
          } else {
            alert('Error! Please verify submission and try again.');
          }
          waitingDialog.hide();
        });
      }
      else {
        alert("Invalid Spreadsheet:\nplease ensure all fields are filled out correctly");
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
