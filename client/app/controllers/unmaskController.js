// /***************************************************************
//  *
//  * unmask/script/unmask.js
//  *
//  * Unmasking interface.
//  *
//  */

 define(['helper/mpc', 'controllers/tableController', 'filesaver'], function (mpc, tableController, filesaver){

  // var rowDict = {'Ex/Sen': ['Executive/Senior Level Officials and Managers', 2],
  //   'F/M': ['First/Mid-Level Officials and Managers', 3],
  //   'Profs': ['Professionals', 4],
  //   'Techs': ['Technicians', 5],
  //   'Sales': ['Sales Workers', 6],
  //   'Adminis': ['Administrative Support Workers', 7],
  //   'Craft': ['Craft Workers', 8],
  //   'Operatives': ['Operatives', 9],
  //   'Laborers': ['Laborers and Helpers', 10],
  //   'Service': ['Service Workers', 11]
  // };

var columnDict = {
  'hispF': 1,
  'hispM': 2,
  'whiteF': 3,
  'whiteM': 4,
  'afrF': 5,
  'afrM': 6,
  'hawaiiF': 7,
  'hawaiiM': 8,
  'asianF': 9,
  'asianM': 10,
  'indF': 11,
  'indM': 12,
  'twoF': 13,
  'twoM': 14,
  'unrF': 15,
  'unrM': 16
};

  // Takes callback(true|false, data).
  function aggregate_and_unmask(mOut, privateKey, session, password, callback) {

    mOut = JSON.parse(mOut.data);

    // Questions Public is the public answers to questions.
    var questions_public = [];
    for (var i = 0; i < mOut.length; i++) {
      questions_public.push(mOut[i].questions_public);
    } 

    var skArrayBuffer; 
    try {
      skArrayBuffer = str2ab(atob(privateKey));
    }
    catch (err) {
      callback(false, 'Error: invalid key file.');
      return;
    }

    // Import key, returns a promise
    var sk = window.crypto.subtle.importKey(
      'pkcs8', // (private only)
      skArrayBuffer,
      {name: 'RSA-OAEP', hash: {name: 'SHA-256'}},
      false, // whether the key is extractable (i.e. can be used in exportKey)
      ['decrypt']
    );

    // Decrypt all value fields in the masked data
    // decrypted is a list of promises, each promise
    // corresponding to a submission with decrypted
    // value fields
    var decrypted = decryptValueShares(sk, mOut, true);
    var questions_public = decryptValueShares(sk, questions_public, false);

    // Aggregate decrypted values by key
    var analystResultShare = decrypted.then(function (analystShares) {
      var invalidShareCount = mpc.countInvalidShares(analystShares);
      // TODO: we should set a threshold and abort if there are too
      // many invalid shares
      console.log('Invalid share count:', invalidShareCount);
      return mpc.aggregateShares(analystShares);
    });

    // Request service to aggregate its shares and send us the result
    var serviceResultShare = getServiceResultShare(session, password);

    Promise.all([analystResultShare, serviceResultShare, questions_public])
      .then(function (resultShares) {
        var analystResult = resultShares[0],
          serviceResult = resultShares[1],
          finalResult = mpc.recombineValues(serviceResult, analystResult);
        if (!ensure_equal(finalResult.questions, mpc.aggregateShares(resultShares[2]))) {
          console.log('Secret-shared question answers do not aggregate to the same values as publicly collected answers.');
        }
        var table_data = callback(true, finalResult);
        generateAggregateCSV(table_data, session);
        generateQuestionsCSV(resultShares[2], session);
      }).catch(function (err) {
      console.log(err);
      callback(false, 'Error: could not compute result.');
    });

    // Do the Hypercube
    var cubes = getCubes(session, password);
    Promise.all([cubes, sk]).then(function (results) {
      var cubes = results[0];
      var importedKey = results[1];
      _decryptWithKey(cubes, importedKey).then(JSON.stringify).then(console.log);
    });
  }

  function getServiceResultShare(session, password) {
    return $.ajax({
      type: 'POST',
      url: '/get_aggregate',
      contentType: 'application/json',
      data: JSON.stringify({
        session: session,
        password: password
      }),
      dataType: 'json'
    });
  }

  function getCubes(session, password) {
    return $.ajax({
      type: 'POST',
      url: '/get_cubes',
      contentType: 'application/json',
      data: JSON.stringify({
        session: session,
        password: password
      }),
      dataType: 'json'
    });
  }



  function populateSheet(dataTable, sheet, meta_data) {
 
    var TITLE_INDEX = 0;
    var RACE_INDEX = 1;
    var GENDER_INDEX = 2;

    var table = [];
    table[TITLE_INDEX] = [sheet];
    // table[RACE_INDEX] = 

    var demoDataArr = [""];


    for (d in columnDict) {
      // console.log('d', d);
      demoDataArr.push(d);
    }

    for (r in dataTable) {
      row = []; 
      row_index = getRowIndex(r, meta_data);
      row.push(meta_data.rows[row_index].replace('<br> ', ''));

      table[row_index] = row;
    }
    return row;

      // row.push(rowDict[r][0]);
    //   for (demoData in dataTable[r]) {
    //     row[columnDict[demoData]] = dataTable[r][demoData];
    //   }

    //   row_index = getRowIndex(r, meta_data)
    
    //   table[row_index] = row.join(',');
    // }

    // table[1] = demoDataArr;
    // table = table.join('\n');
    
    // return table;
  }



  function generateAggregateCSV(finalResult, session) {
    console.log('table data', finalResult);
    // meta_data = table_format[0]._sail_meta;

    // // table_obj = tableController.make_table_obj(table_data);
    // // console.log("TABLEEEEE", table_obj)
    // table = [];
    // // finalResult = finalResult.reverse();
    // for (sheet in finalResult) {
    //   console.log('sheet', sheet)
    //   if (sheet !== 'questions') {
    //     table.push(populateSheet(finalResult[sheet], sheet, meta_data));        
    //   }
    // }
 
    // // }
    // // table.reverse();
    // table = table.join('\n\n\n');
    
    // filesaver.saveAs(new Blob([table], {type: 'text/plain;charset=utf-8'}), 'Aggregate_Data_' + session + '.csv');

  }

  function getRowIndex(key, meta_data) {
    cells = meta_data.cells;
    // console.log("ROWS", meta_data.rows)
    for (var i = 0; i < cells.length; i++) {
      if (cells[i][0].row_key == key) {
        return i;
      }
    }
  }

  function generateQuestionsCSV(questions, session) {
    if (questions.length == 0) return;

    var headers = [];
    for (var key in questions[0]) {
      if (questions[0].hasOwnProperty(key)) {
        headers.push(key);
      }
    }

    var results = [ headers.join(',') ];
    for (var i = 0; i < questions.length; i++) {
      var one_submission = [];
      for (var j = 0; j < headers.length; j++) {
        var q = headers[j];
        var answers = questions[i][q];

        var answer = '';
        for (var option in answers) {
          if (answers.hasOwnProperty(option)) {
            if (answers[option] == 1) {
              answer = option;
              break;
            }
          }
        }

        one_submission.push(answer);
      }
      results.push(one_submission.join(','));
    }

    results = results.join('\n');
   
    filesaver.saveAs(new Blob([results], {type: 'text/plain;charset=utf-8'}), 'Questions_' + session + '.csv');
  }

  function construct_tuple(key, buffer) {
    if (buffer) {
      return function (decryptedShare) {
        var tuple = {};
        tuple[key] = arrayBufferToString(decryptedShare);
        return tuple;
      };
    } else {
      return function (decryptedShare) {
        var tuple = {};
        tuple[key] = decryptedShare;
        return tuple;
      }
    }
  }

  /**
   * @return {promise} a promise to an equivalent object to maskedData, where the keys
   *    and nesting is the same (same schema) but the values are decrypted
   **/
  function _decryptWithKey(obj, importedKey) {
    // decrypt one level of obj, decrypt nested object recursively
    var resultTuples = [];

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = obj[key];
        if (typeof(value) == 'number' || typeof(value) == 'string' || typeof(value) == 'String') {
          // decrypt atomic value
          var resultTuple = window.crypto.subtle.decrypt({name: 'RSA-OAEP'}, importedKey, str2ab(value))
            .then(construct_tuple(key, true));

          resultTuples.push(resultTuple);
        }
        else {
          resultTuples.push(_decryptWithKey(value, importedKey)
            .then(construct_tuple(key, false)));
        }
      }
    }

    return Promise.all(resultTuples).then(function (tuples) {
      // recombine individual key-value pairs into single object
      return Object.assign(...tuples);
    });
  }

  /**
   * @return {promise} a promise to an array of decrypted objects (same schema, value decrypted).
   */
  function decryptValueShares(sk, maskedData, fields) {
    return sk.then(function (importedKey) {
      // decrypt all masks
      var all = [];
      for (var d = 0; d < maskedData.length; d++) {
        all.push(_decryptWithKey(fields ? maskedData[d].fields : maskedData[d], importedKey));
      }

      return Promise.all(all);
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

  function ensure_equal(obj, oth) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key) && oth.hasOwnProperty(key)) {
        var value = obj[key];
        if (typeof(value) == 'number' || typeof(value) == 'string' || typeof(value) == 'String') {
          if (value != oth[key]) {
            return false;
          }
        }
        else {
          var res = ensure_equal(value, oth[key]);
          if (!res) {
            return false;
          }
        }
      }
    }

    return true;
  }

  return {
    aggregate_and_unmask: aggregate_and_unmask

  }

});/*eof*/