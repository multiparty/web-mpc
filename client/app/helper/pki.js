define(['forge'], function (forge) {
  /**
   * Array Buffer / String Manipulation
   */
  var stringToArrayBuffer = function (str) {
    var b = new ArrayBuffer(str.length);
    var view = new Uint8Array(b);
    for (var i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i);
    }
    return b;
  };
  var arrayBufferToString = function (arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer);
    var byteString = '';
    for (var i = 0; i < byteArray.byteLength; i++) {
      byteString += String.fromCharCode(byteArray[i]);
    }
    return byteString;
  };

  /**
   * JIFF section
   */
  // Parsing from PEM
  var parsePublicKey = function (publicKeyString) {
    var pki = forge.pki;
    return pki.publicKeyFromPem(publicKeyString);
  };
  var parsePrivateKey = function (privateKeyString) {
    // var pki = forge.pki;
    // return pki.privateKeyFromPem(privateKeyString);
    try {
      privateKeyString = privateKeyString.split('\n')[1];

      return window.crypto.subtle.importKey(
        'pkcs8', // (private only)
        stringToArrayBuffer(atob(privateKeyString)),
        {name: 'RSA-OAEP', hash: {name: 'SHA-256'}},
        false, // whether the key is extractable (i.e. can be used in exportKey)
        ['decrypt']
      );
    } catch (err) {
      throw new Error('Error: invalid key file.');
    }
  };

  // Encrypt / Decrypt
  var encrypt = function (message, pki) {
    var result = pki.encrypt(message, 'RSA-OAEP', {md: forge.md.sha256.create()});
    return result;
  };
  var decrypt = function (message, ski) {
    // var result = ski.decrypt(message, 'RSA-OAEP', {md: forge.md.sha256.create()});
    // return result;
    return ski.then(function (ski) {
      var promise = window.crypto.subtle.decrypt({name: 'RSA-OAEP'}, ski, stringToArrayBuffer(message));
      return promise.then(function (decrypted) {
        return arrayBufferToString(decrypted);
      });
    });
  };

  /**
   * For generating keys in analyst controller at session creation.
   */
  var arrayBufferToBase64String = function (arrayBuffer) {
    return btoa(arrayBufferToString(arrayBuffer));
  };
  var toPem = function (key, privateKey) {
    if (privateKey) {
      return '-----BEGIN RSA PRIVATE KEY-----\n' +
        key + '\n' +
        '-----END RSA PRIVATE KEY-----';
    } else {
      return '-----BEGIN RSA PUBLIC KEY-----\n' +
        key + '\n' +
        '-----END RSA PUBLIC KEY-----';
    }
  };

  // Returns a promise to an object containing two properties: privateKey, and publicKey
  // privateKey and publicKey are base64 PEM strings.
  var generateKeyPair = function () {
    // Configurations
    var operations = ['encrypt', 'decrypt'];
    var config = {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: {name: 'SHA-256'}
    };

    // Generate key pair
    var promise = window.crypto.subtle.generateKey(config, true, operations);

    // Parse to PEM and return
    var keyPair, privateKey; // Intermediate results
    promise = promise.then(function (_keyPair) {
      keyPair = _keyPair;
      return window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    }).then(function (pkcs8) {
      privateKey = toPem(arrayBufferToBase64String(pkcs8), true);
      return window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    }).then(function (spki) {
      var publicKey = toPem(arrayBufferToBase64String(spki), false);
      return { privateKey: privateKey, publicKey: publicKey };
    });

    return promise;
  };

  return {
    parsePublicKey: parsePublicKey,
    parsePrivateKey: parsePrivateKey,
    encrypt: encrypt,
    decrypt: decrypt,
    generateKeyPair: generateKeyPair
  };
});
