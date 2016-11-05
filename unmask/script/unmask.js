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

    window.crypto.subtle.importKey(
      "pkcs8", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
      str2ab(atob(privateKey)),
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

        // Wait for all promises to complete
        Promise.all(flattenArray(decryptedJson))
          .then(function () {
              var aggObj = aggregate(decryptedJson, true);
              aggObj.then(function (value) {
                session = _.isString(session) ? parseInt(session) : session;
                console.log(aggObj);

                $.ajax({
                  type: "POST",
                  url: "/submit_agg",
                  contentType: "application/json",
                  data: JSON.stringify({data: value, session: session}),
                  dataType: "json",
                  success: function(data){
                    console.log(data);
                    callback(true, data);
                  },
                  error: function(error){callback(false,error)}
                });
              });

          });

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

function flattenArray(data) {
  return _.flatten(_.map(data, _.values));
}

/*eof*/
