/***************************************************************
 *
 * trusted/script/generateSession.js
 *
 * Interface for generating session key and initiating a new
 * session.
 *
 */

function generateSession(hiddenDiv, urlsID, pubID, privID, linkID, submitID, countID) {
    document.getElementById(hiddenDiv).style.visibility = "visible";
    document.getElementById(urlsID).innerHTML = "";
    document.getElementById(pubID).innerHTML = "Loading...";
    document.getElementById(privID).innerHTML = "Loading... (Remember: Do not share this)";
    var keyP, privateKey, publicKey;

    window.crypto.subtle.generateKey({
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: {name: "SHA-256"}
        },
        true,
        ["encrypt", "decrypt"]
    )
        .then(function (keyPair) {
            keyP = keyPair;
            return window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        })
        .then(function (pkcs8) {
            privateKey = toPem(arrayBufferToBase64String(pkcs8), true);
            console.log(privateKey);
            return window.crypto.subtle.exportKey("spki", keyP.publicKey);
        })
        .then(function (spki) {
            publicKey = toPem(arrayBufferToBase64String(spki), false);
            console.log(publicKey);

            var priBlob = new Blob([privateKey],{type: "text/plain;charset=utf-8"});

            // TODO: shouldn't mix promises with callbacks like that
            $.ajax({
                type: "POST",
                url: "/create_session",
                contentType: "application/json",
                data: JSON.stringify({publickey: publicKey}),
                success: function(resp) {
                    console.log(resp);
                    var rndSess = resp.sessionID;

                    document.getElementById(privID).innerHTML = privateKey;
                    document.getElementById(pubID).innerHTML = publicKey;
                    document.getElementById(linkID).innerHTML =
                        "Go To Live Data Page for Session " + rndSess;
                    document.getElementById(linkID).href = "session_data.html?session=" + rndSess;
                    saveAs(priBlob,'Session_' + rndSess + '_private_key.pem');

                    document.getElementById(submitID).onclick = function() {
                      var count = document.getElementById(countID).value;
                      count = parseInt(count);

                      var reg = new RegExp('^[0-9]+$');
                      if(!reg.test(count)) return;

                      $.ajax({
                          type: "POST",
                          url: "/generate_client_urls",
                          contentType: "application/json",
                          data: JSON.stringify({count: count, session: rndSess}),

                          success: function(resp) {
                            var baseUrl = window.location.toString();
                            baseUrl = baseUrl.substring(0,baseUrl.length-"trusted/".length);
                            for(var i=0; i<resp.result.length; i++){
                              resp.result[i] = baseUrl + resp.result[i];
                            }
                            document.getElementById(urlsID).innerHTML = resp.result.join('\n');
                          },

                          error: function() {
                              var errmsg = "ERROR!";
                              document.getElementById(urlsID).innerHTML = errmsg;
                          }
                      });
                    };
                },
                
                error: function() {
                    var errmsg = "ERROR!!!: failed to load public key to server, please try again";
                    document.getElementById(privID).innerHTML = errmsg;
                    document.getElementById(pubID).innerHTML = errmsg;
                }
            });
        })
        .catch(function (err) {
            // TODO: double-check
            console.log(err);
            var errmsg = "ERROR!!!: failed to load public key to server, please try again";
            document.getElementById(privID).innerHTML = errmsg;
            document.getElementById(pubID).innerHTML = errmsg;
        });

    function arrayBufferToString(arrayBuffer) {
        var byteArray = new Uint8Array(arrayBuffer);
        var byteString = '';
        for (var i = 0; i < byteArray.byteLength; i++) {
            byteString += String.fromCharCode(byteArray[i]);
        }
        return byteString;
    }

    function arrayBufferToBase64String(arrayBuffer) {
        return btoa(arrayBufferToString(arrayBuffer));
    }

    function toPem(key, privateKey) {
        if (privateKey) {
            return "-----BEGIN RSA PRIVATE KEY-----\n" +
                key + "\n" +
                "-----END RSA PRIVATE KEY-----";
        } else {
            return "-----BEGIN RSA PUBLIC KEY-----\n" +
                key + "\n" +
                "-----END RSA PUBLIC KEY-----";
        }

    }
}

// TODO: why two error handlers?
function generateTable(tableBody, sessionID, status, timestamp, counter) {
    if (timestamp === undefined) timestamp = 0;
    if (counter === undefined) counter = 1;
    var date = Date.now();
    $.ajax({
        type: "POST",
        url: "/get_data",
        contentType: "application/json",
        data: JSON.stringify({session: sessionID, last_fetch: timestamp}),
        dataType: "json",
        error: function () {
            console.log("error connecting");
        },
        success: function (data) {
            if (!_.isEmpty(data)) {
                var rows = _.map(_.pairs(data), function (pair) {
                    return "<tr>\
                            <td>" + pair[0] + "</td>\
                            <td>" + new Date(pair[1]).toLocaleString() + "</td>\
                        </tr>"
                });
                document.getElementById(status).innerHTML = "LOADING...";
                document.getElementById(status).className = "alert alert-success";
                document.getElementById(tableBody).innerHTML += _.foldr(rows, function (a, b) {
                    return a + b;
                }, "");
            }
            setTimeout(function () {
                generateTable(tableBody, sessionID, status, date)
            }, 10000);
        },
        error: function () {
            document.getElementById(status).className = "alert alert-error";
            document.getElementById(status).innerHTML = "Error Connecting: Reconnect Attempt #" + counter.toString();
            setTimeout(function () {
                generateTable(tableBody, sessionID, status, date, counter + 1)
            }, 10000);
        }
    });
}

/*eof*/
