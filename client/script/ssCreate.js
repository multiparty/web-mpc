/***************************************************************
 *
 * client/script/ssCreate.js
 *
 * Creates a spreadsheet that is obfuscated with Random numbers
 * Dependancies: Handsontable.js, underscore.js, jquery
 * Author: Eric Dunton
 *
 */

//Creates table from processed CSV table and places it into divId
function makeTable(sheet, divId) {
    var rowHeaders = sheet["rowHeaders"],
        colHeaders = sheet["colHeaders"],
        hot = new Handsontable(document.getElementById(divId), {
          rowHeaders: rowHeaders,
          colHeaders: colHeaders,
          maxRows: rowHeaders.length,
          maxCols: colHeaders.length,
          columns: _.map(colHeaders, 
            function(header) {
                var is_whole = function(x,callback){
                    if(x >= 0 && x % 1 == 0) callback(true);
                    else {
                        alert("All cells must have whole number input");
                        callback(false);
                    }
                }
                return {
                        data: header, 
                        type: 'numeric', 
                        format: '0,0',
                        validator: is_whole,
                        allowInvalid: false
                       }; 
            }),
          manualColumnResize: true,
          contextMenu: false,
          minSpareRows: 0,
          data: sheet["lines"],
          cells: function(row,col,prop) {
            var cellProperties = {},
                inspect = this.instance.getData()[row][prop];
            if ( inspect === '#'){
                cellProperties.readOnly = true;
                cellProperties.renderer = makeBlank
            }
            return cellProperties;
          }
        });
    return {"table":hot, "rowHeaders":rowHeaders, "colHeaders":colHeaders};
}

//initializes the submit button with all instances of Handsontable
function initiate_button(instances,button,url,session,email) {
    Handsontable.Dom.addEvent(document.body, 'click', function (e) {

      var element = e.target || e.srcElement,
          retObj = {};

        if (element.nodeName == "BUTTON" && element.name == button) {
            
            waitingDialog.show('Loading Data',{dialogSize: 'sm', progressType: 'warning'});
            var sessionstr = $('#'+session).val().trim();
            var emailstr = $('#'+email).val().trim();
            
            if(!sessionstr.match(/[0-9]{7}/)){
                alert("invalid session number: must be 7 digit number");
                waitingDialog.hide();
                return;
            }
            
            if(!emailstr.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)){
                alert("Did not type a correct email address");
                waitingDialog.hide();
                return;
            }
            
            $.ajax({
                    type: "POST",
                    url: "/publickey",
                    contentType: "application/json",
                    data: JSON.stringify({session: parseInt(sessionstr)}),
                    dataType: "text"
                })
            .done(function(publickey){
                for(var key in instances){
                    var jsonData = _.object(instances[key].rowHeaders, 
                                _.map(instances[key].table.getData(), function(row){
                                    return _.omit(
                                    _.object(instances[key].colHeaders,
                                        _.map(_.values(row), function(x){
                                            if (_.isString(x) && x.trim() == "") return x;
                                            if (_.isString(x) && x.trim() == "#") return "#";
                                            return Number(x);}))
                                        , function(value, key, object) {return value == "#"})
                                    })),
                        verAux = function(a){
                            return _.reduce(a,function(memo,v){return memo && v;},true)
                        },
                        verified = true;

                    verified = verified && verAux(_.map(_.values(jsonData),
                                    function(val){
                                        return verAux(
                                                _.map(_.values(val), 
                                                function(x){ 
                                                    return _.isNumber(x) && x >= 0 && x % 1 == 0; 
                                                }));
                                    }
                                    ));
                    retObj[key] = jsonData;
                }
                if(verified){
                    var flat = flattenObj(retObj),
                        maskObj = genMask(_.keys(flat)),
                        encryptedMask = encryptWithKey(maskObj,publickey);
                    console.log("Key: ");
                    console.log(publickey);
                    console.log('data: ', flat);

                    for(var k in flat){
                        flat[k] += maskObj[k];
                    }
                    console.log('masked data: ', flat);
                    console.log('encrypted mask: ', encryptedMask);

                    var sendData = {
                        data: flat, 
                        mask: encryptedMask, 
                        user: emailstr, 
                        session: parseInt(sessionstr)
                    };

                    $.ajax({
                        type: "POST",
                        url: url,
                        data: JSON.stringify(sendData),
                        contentType: 'application/json',
                        success: function(data){
                            waitingDialog.hide();
                            //window.location.href = "success.html";
                            alert("Submited data");
                            console.log('returned: ', data);
                        },
                        error: function(){
                            waitingDialog.hide();
                            alert("Failed to Submit data");
                        }
                    });
                }
                else{
                    waitingDialog.hide();
                    alert("Invalid Spreadsheet:\nplease ensure all fields are filled out");
                }
            })
            .error(function(){
                alert("Server failure");
                waitingDialog.hide();
                return;
            }); 
      }
    });
}

//Parses CSV file into conveniant format
function processData(allText) {
    var allTextLines = allText.trim().split(/\r\n|\n/);
    var headers = _.drop(allTextLines[0].split(','));
    var rows = [];
    var lines = [];

    for (var i=1; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data.length > 0) {

            var tarr = {};
            rows.push(data[0]);
            data = _.drop(data);
            for (var j=0; j<data.length; j++) {
                tarr[headers[j]] = data[j];
            }
            lines.push(tarr);
        }
    }
    return {"colHeaders":headers,"rowHeaders": rows,"lines":lines};
}

//creates propertes of a blank cell
function makeBlank(instance, td, row, col, prop, value, cellProperties)
{
    td.style.color = 'black';
    td.style.background = 'black';
}
// flatten any object to a 1D object with concatinated keys
function flattenObj(obj){
    if(!_.isObject(obj)) return {"": obj};
    var collectObj = {};
    for(var key in obj) {
        var ind = flattenObj(obj[key]);
        for(var k in ind)
            collectObj[key + (k === ""? "" : "_" + k)] = ind[k];
    }
    
    return collectObj;
}

//generates array of random numbers
function secureRandom(size){
    var array = new Uint32Array(size);
    window.crypto.getRandomValues(array);
    return array;
}

//creates random mask
function genMask(keys){
    return _.object(keys, secureRandom(keys.length));
}

function encryptWithKey(obj, key)
{
    var jsencrypt = new JSEncrypt();
    jsencrypt.setPublicKey(key);

    return _.mapObject(obj, function(x,k){return jsencrypt.encrypt(x.toString())});
}

/*eof*/