/***************************************************************
 *
 * unmask/script/unmask.js
 *
 * Unmasking interface.
 *
 */

// Takes callback(true|false, data).
function aggregate_and_unmask(mOut, privateKey, session, password, callback) {
  console.log(mOut);
  mOut = JSON.parse(mOut.data);
  
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
  var decrypted = decryptValueShares(sk, mOut);

  // Aggregate decrypted values by key
  var analystResultShare = decrypted.then(function (analystShares) {
    var invalidShareCount = countInvalidShares(analystShares);
    // TODO: we should set a threshold and abort if there are too
    // many invalid shares
    console.log('Invalid share count:', invalidShareCount);
    return aggregateShares(analystShares); 
  });

  // Request service to aggregate its shares and send us the result
  var serviceResultShare = getServiceResultShare(session, password);

  Promise.all([analystResultShare, serviceResultShare])
  .then(function (resultShares) {
    var analystResult = resultShares[0],
        serviceResult = resultShares[1],
        finalResult = recombineValues(serviceResult, analystResult);
    callback(true, finalResult);
  }).catch(function (err) {
    console.log(err);
    callback(false, "Error: could not compute result.");
  });
}

function getServiceResultShare (session, password) {
  return $.ajax({
    type: "POST",
    url: "/get_aggregate",
    contentType: "application/json",
    data: JSON.stringify({
      session: session,
      password: password
    }),
    dataType: "json"
  });
}

function construct_tuple(key, buffer) {
  if(buffer) 
    return function (decryptedShare) { 
      var tuple = {}; tuple[key] = arrayBufferToString(decryptedShare);
      return tuple;
    };
    
  else
    return function (decryptedShare) { 
      var tuple = {}; tuple[key] = decryptedShare;
      return tuple;
    } 
}

/**
 * @return {promise} a promise to an equivalent object to maskedData, where the keys
 *    and nesting is the same (same schema) but the values are decrypted
**/
function _decryptWithKey (obj, importedKey) {
  // decrypt one level of obj, decrypt nested object recursively
  var resultTuples = [];
  
  for(var key in obj) {
    if (obj.hasOwnProperty(key)) {
      //console.log(key);
      var value = obj[key];
      if(typeof(value) == "number" || typeof(value) == "string" || typeof(value) == "String") {
        // decrypt atomic value          
        var resultTuple = window.crypto.subtle.decrypt({name: "RSA-OAEP"}, importedKey, str2ab(value))
          .then(construct_tuple(key, true));
          
        resultTuples.push(resultTuple);
      }
      else 
        resultTuples.push(_decryptWithKey(value, importedKey)
          .then(construct_tuple(key, false)));
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
function decryptValueShares (sk, maskedData) {
  return sk.then(function (importedKey) {
    // decrypt all masks
    var all = [];
    for(var d = 0; d < maskedData.length; d++) {
      all.push(_decryptWithKey(maskedData[d].fields, importedKey));
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



/*eof*/
