// /***************************************************************
//  *
//  * unmask/script/unmask.js
//  *
//  * Unmasking interface.
//  *
//  */

/*eslint no-console: ["error", { allow: ["warn", "error"] }] */
define(['helper/mpc'], function (mpc) {

  // Takes callback(true|false, data).
  function aggregateAndUnmask(mOut, privateKey, session, password, callback) {

    mOut = JSON.parse(mOut.data);

    var skArrayBuffer;
    try {
      skArrayBuffer = str2ab(atob(privateKey));
    } catch (err) {
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

    // Aggregate decrypted values by key
    var analystResultShare = decrypted.then(function (analystShares) {
      return mpc.aggregateShares(analystShares);
    });

    // Request service to aggregate its shares and send us the result
    var serviceResultShare = getServiceResultShare(session, password);

    Promise.all([analystResultShare, serviceResultShare])
      .then(function (resultShares) {
        var analystResult = resultShares[0],
          serviceResult = resultShares[1],
          finalResult = mpc.recombineValues(serviceResult, analystResult);

        // if (!ensure_equal(finalResult.questions, mpc.aggregateShares(resultShares[2]))) {
        //   console.error('Secret-shared question answers do not aggregate to the same values as publicly collected answers.');
        // }
        // generateQuestionsCSV(resultShares[2], session)
        callback(true, finalResult, [], session);

      })
      .catch(function (err) {
        console.error(err);
        callback(false, 'Error: could not compute result.');
      });

    // Do the Hypercube
    // NOTE: do we need this?
    // var cubes = getCubes(session, password);
    // Promise.all([cubes, sk]).then(function (results) {
    //   var cubes = results[0];
    //   var importedKey = results[1];
    //   // _decryptWithKey(cubes, importedKey).then(JSON.stringify).then(console.error);
    //   _decryptWithKey(cubes, importedKey);
    // });
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

  // TODO: what is this doing?
  // function getCubes(session, password) {
  //   return $.ajax({
  //     type: 'POST',
  //     url: '/get_cubes',
  //     contentType: 'application/json',
  //     data: JSON.stringify({
  //       session: session,
  //       password: password
  //     }),
  //     dataType: 'json'
  //   });
  // }


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
        if (typeof(value) === 'number' || typeof(value) === 'string') {
          // decrypt atomic value
          var resultTuple = window.crypto.subtle.decrypt({name: 'RSA-OAEP'}, importedKey, str2ab(value))
            .then(construct_tuple(key, true));

          resultTuples.push(resultTuple);
        } else {
          resultTuples.push(_decryptWithKey(value, importedKey)
            .then(construct_tuple(key, false)));
        }
      }
    }

    if (resultTuples !== undefined) {
      return Promise.all(resultTuples).then(function (tuples) {
        // recombine individual key-value pairs into single object
        return Object.assign(...tuples);
      });
    }
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
        if (typeof(value) === 'number' || typeof(value) === 'string') {
          if (value !== oth[key]) {
            return false;
          }
        } else {
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
    aggregateAndUnmask
  }
});
