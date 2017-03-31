/***************************************************************
 *
 * unmask/script/unmask.js
 *
 * Unmasking interface.
 *
 */


// TODO: unmask is a misnomer
// Takes callback(true|false, data).
function unmask(mOut, privateKey, session, analystEmail, callback){
  mOut = JSON.parse(mOut.data);
  
  var maskedData = [];
  for (row in mOut) {
    maskedData.push(mOut[row].fields);
  }

  var skArrayBuffer;
  try {
    skArrayBuffer = str2ab(atob(privateKey));  
  }
  catch (err) {
    callback(false, "Error: invalid key file.");
    return;
  }
  
  // Import key, returns a promise
  var sk = window.crypto.subtle.importKey(
    "pkcs8", // (private only)
    skArrayBuffer,
    {name: "RSA-OAEP", hash: {name: "SHA-256"}},
    false, // whether the key is extractable (i.e. can be used in exportKey)
    ["decrypt"]
  );

  // Decrypt all value fields in the masked data
  // decrypted is a list of promises, each promise
  // corresponding to a submission with decrypted
  // value fields
  var decrypted = decryptValueShares(sk, maskedData);

  // Aggregate decrypted values by key
  var analystResultShare = decrypted.then(function (analystShares) {
    var invalidShareCount = countInvalidShares(analystShares);
    // TODO: we should set a threshold and abort if there are too
    // many invalid shares
    console.log('Invalid share count:', invalidShareCount);
    return aggregateShares(analystShares); 
  });

  var initiatorPK = getInitiatorPK(session);

  Promise.all([analystResultShare, serviceResultShare])
  .then(function (resultShares) {
    var analystResult = resultShares[0],
        serviceResult = resultShares[1],
        finalResult = recombineValues(analystResult, serviceResult);
    callback(true, finalResult);
  })
  .catch(function (err) {
    console.log(err);
    callback(false, "Error: could not compute result.");
  });
}

function getInitiatorPK (session) {
  return $.ajax({
    type: "POST",
    url: "/initiator_pk",
    contentType: "application/json",
    data: JSON.stringify({
      session: session
    }),
    dataType: "json"
  });
}

// TODO: add comments

/**
 * This function returns 
**/
function _decryptValueShares (importedKey, maskedData) {

  var decryptedData = maskedData.map(function (submission) {
    var resultTuples = [];
    
    for (let key in submission) {
      if (submission.hasOwnProperty(key)) {
        var encryptedShare = submission[key];

        var resultTuple = window.crypto.subtle.decrypt(
          {name: "RSA-OAEP"},
          importedKey,
          str2ab(encryptedShare)
        ).then(function (decryptedShare) {
          var tuple = {};
          tuple[key] = arrayBufferToString(decryptedShare);
          return tuple;
        });

        resultTuples.push(resultTuple);
      }
    }

    var decryptedSubmission = Promise.all(resultTuples).then(function (tuples) {
      // recombine individual key-value pairs into single object
      return Object.assign(...tuples);
    });

    return decryptedSubmission;
  });

  return Promise.all(decryptedData);
}

function decryptValueShares (sk, maskedData) {
  return sk.then(function (importedKey) {
    return _decryptValueShares(importedKey, maskedData);
  });
}

function str2ab (str) {
    var b = new ArrayBuffer(str.length);
    var view = new Uint8Array(b);
    for (var i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return b;
}

function arrayBufferToString (arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    var byteString = '';
    for (var i = 0; i < byteArray.byteLength; i++) {
        byteString += String.fromCharCode(byteArray[i]);
    }
    return byteString;
}

/*eof*/
