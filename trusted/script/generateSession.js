function generateSession(hiddenDiv, sessionID, pubID, privID, linkID){
    
    document.getElementById(hiddenDiv).style.visibility = "visible";
    var rndSess = Math.floor((Math.random() * 8999999) + 1000000),
        jsen = new JSEncrypt();
    document.getElementById(sessionID).innerHTML = rndSess;
    document.getElementById(pubID).innerHTML = "Loading...";
    document.getElementById(privID).innerHTML = "Loading... (Remember: Do not share this)";
    
    jsen.getKey(function(){
        
        var priKey = jsen.getPrivateKey(),
            pubKey = jsen.getPublicKey(),
            priblob = new Blob([priKey],{type: "text/plain;charset=utf-8"});
        
        $.ajax({
            type: "POST",
            url: "/create_session",
            dataType: "json",
            data: { session: rndSess, publickey: pubKey},
            success: function(a,b){
                document.getElementById(privID).innerHTML = priKey;
                document.getElementById(pubID).innerHTML = pubKey;
                document.getElementById(linkID).innerHTML = 
                    "Go To Live Data Page for Session " + rndSess.toString();
                document.getElementById(linkID).href += "?session=" + rndSess.toString();
                saveAs(priblob,'Session_'+rndSess.toString()+'_private_key.pem');
            },
            error: function(){
                var errmsg = "ERROR!!!: failed to load public key to server, please try again";
                document.getElementById(privID).innerHTML = errmsg;
                document.getElementById(pubID).innerHTML = errmsg;
            }
        });    
    });
}

function generateTable(tableBody,sessionID,status,timestamp,counter){
    if(timestamp === undefined) timestamp = 0;
    if(counter === undefined) counter = 1;
    var date = Date.now();
    $.ajax({
        type: "POST",
        url:"/get_data",
        data: {session: sessionID, lastFetch: timestamp},
        dataType: "json",
        error: function(){
            console.log("error connecting");
        },
        success: function(data)
        {
            if(!_.isEmpty(data)){
                var rows = _.map(_.pairs(data),function(pair){
                return  "<tr>\
                            <td>"+ pair[0] +"</td>\
                            <td>" + new Date(pair[1]).toLocaleString() + "</td>\
                        </tr>"
                });
                document.getElementById(status).innerHTML = "LOADING...";
                document.getElementById(status).className = "alert alert-success";
                document.getElementById(tableBody).innerHTML += _.foldr(rows, function(a,b){return a + b;},"");
            }
            setTimeout(function(){generateTable(tableBody, sessionID, status, date)}, 10000);
        },
        error: function(){
            document.getElementById(status).className = "alert alert-error";
            document.getElementById(status).innerHTML = "Error Connecting: Reconnect Attempt #" + counter.toString();
            setTimeout(function(){generateTable(tableBody, sessionID, status, date, counter + 1)}, 10000);
        }
    });
}
