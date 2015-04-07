/***************************************************************
 *
 * unmask/script/unmask.js
 *
 * Unmasking interface.
 *
 */

// Takes callback(true|false, data).
function unmask(mOut, decryptObj, session, callback){
    mOut = JSON.parse(mOut.data);
    var maskedData = [];

    //console.log(mOut);
    for (row in mOut) {
        maskedData.push(mOut[row].fields);
    }

    console.log(maskedData);

    // Decrypt the JSON data.
    var decryptedJson = _.map(maskedData, function (submission){
        return _.mapObject(submission, function (val, key){
            return decryptObj.decrypt(val);
        });
    });

    var aggObj = aggregate(decryptedJson, true);
    session = _.isString(session) ? parseInt(session) : session;
    console.log(aggObj);

    $.ajax({
        type: "POST",
        url: "/submit_agg",
        contentType: "application/json",
        data: JSON.stringify({data: aggObj, session: session}),
        dataType: "json",
        success: function(data){
            console.log(data);
            callback(true, data);
        },
        error: function(){callback(false,"submission to server failed")}
    });
}

/*eof*/