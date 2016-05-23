/***************************************************************
 *
 * trusted/script/ssCreate.js
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
function initiate_button(instances,button,url) {
    Handsontable.Dom.addEvent(document.body, 'click', function (e) {

      var element = e.target || e.srcElement,
          retObj = {};

      if (element.nodeName == "BUTTON" && element.name == button) {
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
            retObj[key] = obfuscate(jsonData);
        }
        if(verified){
            console.log('data: ', retObj);
            $.post(url, retObj);
        }
        else
            alert("Invalid Spreadsheet:\nplease ensure all fields are filled out");

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

//obfusates every element of input and return obfuscation
//and random numbers used to obfuscate 
function obfuscate(jsonData)
{
    var obfuscateFun = function(x) {return x[0]*x[1]},
        encrypt = _.mapObject(jsonData, 
            function(rows, key){
                var keys = _.keys(rows),
                    rnd = secureRandom(keys.length),
                    vals = _.values(rows);
                return {
                    data: _.object(keys, _.map(_.zip(rnd,vals), obfuscateFun)),
                    random: _.object(keys, rnd)
                };
            });

    return  {
            data: _.mapObject(encrypt, 
                function(val,key){
                    return val.data;
                }),
            random: _.mapObject(encrypt, 
                function(val,key){
                    return val.random;
                })
            };
}

//generates array of random numbers
function secureRandom(size){
    var array = new Uint32Array(size);
    var cryptoObj = window.crypto || window.msCrypto; // IE 11 fix
    cryptoObj.getRandomValues(array);
    return array;
}

/*eof*/