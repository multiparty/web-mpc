/***************************************************************
 *
 * unmask/script/unmask.js
 *
 * Unmasking interface.
 *
 */

// Takes callback(true|false, data).
function unmask(mOut, privateKey, session, callback){
    mOut = JSON.parse(mOut.data);
    var maskedData = [];

    //console.log(mOut);
    for (row in mOut) {
      maskedData.push(mOut[row].fields);
    }

    console.log(maskedData);

    var skArrayBuffer;
    try {
       skArrayBuffer = str2ab(atob(privateKey));  
    }
    catch (err) {
      callback(false, "Error: invalid key file.");
      return;
    }
    
    window.crypto.subtle.importKey(
      "pkcs8", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
      skArrayBuffer,
      {   //these are the algorithm options
          name: "RSA-OAEP",
          hash: {name: "SHA-256"} //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
      },
      false, //whether the key is extractable (i.e. can be used in exportKey)
      ["decrypt"] //"encrypt" or "wrapKey" for public key import or
      //"decrypt" or "unwrapKey" for private key imports
    ).then(function (importedKey) {
        // Decrypt the JSON data.
        var decryptedJson = _.map(maskedData, function (submission){
            return _.mapObject(submission, function (val, key) {
                return window.crypto.subtle.decrypt({
                      name: "RSA-OAEP"
                  },
                  importedKey, // from generateKey or importKey above
                  str2ab(val) // ArrayBuffer of the data
                )
                  .then(function(decrypted) {
                      // returns an ArrayBuffer containing the decrypted data
                      var res = arrayBufferToString(decrypted);
                      return res;
                  })
                  .catch(function(err){
                      console.error(err);
                  });
            });
        });

        // TODO: error handling is incorrect
        // Wait for all promises to complete
        Promise.all(flattenArray(decryptedJson))
          .then(function () {
              var aggObj = aggregateShares(decryptedJson, FIELD);
              aggObj.then(function (value) {
                console.log(aggObj);

                // TODO: callbacks
                $.ajax({
                  type: "POST",
                  url: "/submit_agg",
                  contentType: "application/json",
                  data: JSON.stringify({data: value, session: session}),
                  dataType: "json",
                  success: function (data) {
                    console.log(data);
                    callback(true, data);
                  },
                  error: function (err) {
                    console.log(err);
                    callback(false, "Error: could not compute aggregate.");
                  }
                });
              });
          });
    }).catch(function (err) {
      callback(false, "Error: could not decrypt.");
      return;
    });
}

function str2ab(str) {
    var b = new ArrayBuffer(str.length);
    var view = new Uint8Array(b);
    for (var i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return b;
}

function arrayBufferToString(arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    var byteString = '';
    for (var i = 0; i < byteArray.byteLength; i++) {
        byteString += String.fromCharCode(byteArray[i]);
    }
    return byteString;
}

// Not a very descriptive name, I just like the word.
// transforms "key1_key2_key#...: val" into {key_1: {key_2: {key_3: val}}}
// REVIEW
function unflatten(data) {
  var nested = {};
  var current = nested;

  for (var topLevelKey in data) {
    if (data.hasOwnProperty(topLevelKey)) { // do we really need this?
      var value = data[topLevelKey],
          splitKey = topLevelKey.split('_'),
          lastKey = splitKey[splitKey.length - 1];
      splitKey.forEach(function (key) {
        // if we're a last level of nesting, store value
        if (key === lastKey) {
          current[key] = value;
        }
        else {
          // we haven't reached the last level yet
          // so create a new level in nested if necessary
          // or advance one level by key
          if (!(current.hasOwnProperty(key))) {
            current[key] = {};
          }
          current = current[key];
        }
      });
      // return to top level of nesting
      current = nested;
    }
  }

  return nested;
}

function flattenArray(data) {
  return _.flatten(_.map(data, _.values));
}

function makeTable(divID, tableConfig) {
  var hotElement = document.querySelector(divID),
      hotSettings = {
          width: 1024,
          columns: tableConfig.columns,
          rowHeaders: tableConfig.rowHeaders,
          nestedHeaders: tableConfig.nestedHeaders,
          maxRows: tableConfig.numRows,
          maxCols: tableConfig.numCols,
          readOnly: true
        },
      hot = new Handsontable(hotElement, hotSettings);
  return hot;
}

function make2DArray(numRows, numCols) {
  var arr = new Array(numRows);
  for (var i = 0; i < numRows; i++) {
    arr[i] = new Array(numCols);
  }
  return arr;
}

function populateTable(
  hot, 
  data, 
  numRows, 
  numCols, 
  rowIdxLookup, 
  colIdxLookup
) {
  var buffer = make2DArray(numRows, numCols);

  for (var rowKey in data) {
    if (data.hasOwnProperty(rowKey)) {
      var columns = data[rowKey];
      for (var colKey in columns) {
        if (columns.hasOwnProperty(colKey)) {
          var value = columns[colKey];
          rowIdx = rowIdxLookup[rowKey],
          colIdx = colIdxLookup[colKey];
          buffer[rowIdx][colIdx] = value;
        }
      } 
    }
  }
  
  hot.table.loadData(buffer);
}

function displayResults(divID, hot, data, tableConfig) {
  // Check if we have created the table already. This prevents
  // new copies of the table from getting appended to the end
  // of the containing div.
  if (hot.table == null) {
    hot.table = makeTable(divID, tableConfig);
  }
  // TODO: double-check this
  var rowIdxLookup = {};
  tableConfig.rowKeys.forEach(function (key, idx) {
    return rowIdxLookup[key] = idx;
  });
  var colIdxLookup = {};
  tableConfig.colKeys.forEach(function (key, idx) {
    return colIdxLookup[key] = idx;
  });
  console.log(rowIdxLookup);
  console.log(colIdxLookup);

  // Populate table with loaded values.
  populateTable(hot, data, tableConfig.numRows, 
    tableConfig.numCols, rowIdxLookup, colIdxLookup);
}

function displayFromTemplate(divID, hot, data, templateUrl) {
  $.ajax({
    type: "GET",
    url: templateUrl,
    dataType: "json",
    success: function (tableConfig) {
      $(divID).show();
      displayResults(divID, hot, data, tableConfig)
    },
    error: function () {
      console.log('Error while retrieving template.');
      $('#error').html('Error while retrieving template.');
    }
  });
}

// TODO: displaying raw html like that is bad 
function displaySimple(divID, data) {
  var container = $(divID);
  container.empty();
  for (var question in data) {
    if (data.hasOwnProperty(question)) {
      var awnserSect = data[question];
      container.append("<p>" + question + "</p>");
      for (var answerText in awnserSect) {
        if (awnserSect.hasOwnProperty(answerText)) {
          container.append("<p>" + answerText + ": " + awnserSect[answerText] + "</p>");
        }
      }
    }
  }
  container.show();
}

/*eof*/
