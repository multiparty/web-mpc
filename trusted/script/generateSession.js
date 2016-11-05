/***************************************************************
 *
 * trusted/script/generateSession.js
 *
 * Interface for generating session key and initiating a new
 * session.
 *
 */

function generateSession(hiddenDiv, sessionID, pubID, privID, linkID) {

    document.getElementById(hiddenDiv).style.visibility = "visible";
    var rndSess = Math.floor((Math.random() * 8999999) + 1000000),
        jsen = new JSEncrypt();
    document.getElementById(sessionID).innerHTML = rndSess;
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

            $.ajax({
                type: "POST",
                url: "/create_session",
                contentType: "application/json",
                data: JSON.stringify({ session: rndSess, publickey: publicKey}),
                success: function(){
                    document.getElementById(privID).innerHTML = privateKey;
                    document.getElementById(pubID).innerHTML = publicKey;
                    document.getElementById(linkID).innerHTML =
                        "Go To Live Data Page for Session " + rndSess.toString();
                    document.getElementById(linkID).href += "?session=" + rndSess.toString();
                    saveAs(priBlob,'Session_'+rndSess.toString()+'_private_key.pem');
                },
                error: function(){
                    var errmsg = "ERROR!!!: failed to load public key to server, please try again";
                    document.getElementById(privID).innerHTML = errmsg;
                    document.getElementById(pubID).innerHTML = errmsg;
                }
            });
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

function generateTable(tableBody, sessionID, status, timestamp, counter) {
    if (timestamp === undefined) timestamp = 0;
    if (counter === undefined) counter = 1;
    var date = Date.now();
    $.ajax({
        type: "POST",
        url: "/get_data",
        contentType: "application/json",
        data: JSON.stringify({session: parseInt(sessionID), last_fetch: timestamp}),
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
