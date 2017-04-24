/***************************************************************
 *
 * TODO
 *
 */


// TODO: unmask is a misnomer
function unmask (rawShares, initiatorPK, privateKey, analystEmail) {
  var jsonShares = JSON.parse(rawShares.data);
  
  var encryptedShares = [];
  for (row in jsonShares) {
    encryptedShares.push(jsonShares[row].fields);
  }

  // Remove top and bottom line of pem file
  privateKey = privateKey.split("\n")[1];
  // Import private key for decryption
  var skArrayBuffer = str2ab(atob(privateKey)),
      sk = window.crypto.subtle.importKey(
        "pkcs8", // (private only)
        skArrayBuffer,
        {name: "RSA-OAEP", hash: {name: "SHA-256"}},
        false, // whether the key is extractable (i.e. can be used in exportKey)
        ["decrypt"]
      );

  // Remove top and bottom line of pem file
  initiatorPK = initiatorPK.split("\n")[1];
  // Import private key for decryption
  var pkArrayBuffer = str2ab(atob(initiatorPK)),
      initiatorPK = window.crypto.subtle.importKey(
        "spki", // (public only)
        pkArrayBuffer,
        {name: "RSA-OAEP", hash: {name: "SHA-256"}},
        false, // whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt"]
      );


  // Decrypt all value fields in the masked data
  // decrypted is a list of promises, each promise
  // corresponding to a submission with decrypted
  // value fields
  var decrypted = decryptValueShares(sk, encryptedShares);

  // Aggregate decrypted values by key
  var resultSharesProm = decrypted.then(function (analystShares) {
    var invalidShareCount = countInvalidShares(analystShares);
    // TODO: we should set a threshold and abort if there are too
    // many invalid shares
    console.log("Invalid share count:", invalidShareCount);
    return aggregateShares(analystShares); 
  });

  return Promise.all([resultSharesProm, initiatorPK])
  .then(function (sharesAndPK) {
    var resultShares = sharesAndPK[0],
        initiatorPK = sharesAndPK[1];
    
    return true;
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
