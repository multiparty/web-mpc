//takes callback(true|false, data)
function unmask(maskedData,decryptObj,session,callback){
    var decryptedJson = _.map(maskedData,function(submittion){
        return _.mapObject(submittion, function(val,key){
            return decryptObj.decrypt(val);
        });
    });
    
    var keys = _.keys(decryptedJson[0]),
        aggObj = _.object(keys, _.map(_.range(keys.length), 
    											function (x) { return 0;}));
    
    for(var i = 0; i < decryptedJson.length; i++)
    {
        for(var key in aggObj)
        {
            aggObj[key] += parseInt(decryptedJson[i][key]);
        }
    }
    
    session = _.isString(session) ? parseInt(session) : session;
    
    console.log(aggObj);
    
    $.ajax({
        type: "POST",
        url: "/submit_agg",
        data: {data: aggObj, session: session},
        dataType: "json",
        success: function(data){callback(true,data)},
        error: function(){callback(false,"submittion to server failed")}
    });
}