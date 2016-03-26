/***************************************************************
 *
 * client/script/ssCreate.js
 *
 * Creates a spreadsheet that is obfuscated with random numbers.
 * Dependancies: Handsontable.js, underscore.js, jquery
 * Author: Eric Dunton
 *
 */
allValid = {females: 0, males: 0, verify: 0};

//Creates table from processed CSV table and places it into divId
function makeTable(sheet, divId) {
    var rowHeaders = sheet["rowHeaders"],
        colHeaders = sheet["colHeaders"],
        $submitButton = $('#submit'),
        validFields = new Array(sheet['rowHeaders'].length);
        for (var i = 0; i < validFields.length; i++) {
            validFields[i] = new Array(sheet['colHeaders'].length);
        }


        $submitButton.prop('disabled', true);
        hot = new Handsontable(document.getElementById(divId), {
          rowHeaders: rowHeaders,
          colHeaders: colHeaders,
          maxRows: rowHeaders.length,
          maxCols: colHeaders.length,
          afterSelection: function (row, col, row2, col2) {
            // Don't allow fill handle for read-only cells, could accidentally mess up document
            var meta = this.getCellMeta(row2, col2);
            if (meta.readOnly) {
                this.updateSettings({fillHandle: false});
            } else {
               this.updateSettings({fillHandle: true});
            }
          },
          columns: _.map(colHeaders,
            function(header) {
                var is_whole = function(x,callback){
                    if (x >= 0 && x % 1 == 0 && x !== '') {
                            callback(true);
                    } else {
                        callback(false);
                    }
                };
                return {
                        data: header,
                        type: 'numeric',
                        format: '0,0',
                        validator: is_whole,
                        allowInvalid: true
                       };
            }),
          manualColumnResize: true,
          contextMenu: false,
          minSpareRows: 0,
          data: sheet["lines"],
          afterValidate: function (isValid, value, row, prop, source) {
              var col = hot.propToCol(prop);

              // Enable/disable submit button based on valid data
              if (!isValid) {
                  allValid[divId] = 0;
                  validFields[row][col] = 0;
                  $submitButton.prop('disabled', true);
                  return;
              } else {
                  validFields[row][col] = 1;
              }

              var invalid = false;
              outer:
              for (var i = 0; i < validFields.length; i++) {
                  for (var j = 0; j < validFields[i].length; j++) {
                      if (validFields[i][j] === 0 || typeof validFields[i][j] === 'undefined') {
                          invalid = true;
                          break outer;
                      }
                  }
              }
              if (invalid) {
                  allValid[divId] = 0;
                  $submitButton.prop('disabled', true);
              } else {
                  allValid[divId] = 1;
                  if (allValid.females && allValid.males && allValid.verify) {
                      $submitButton.prop('disabled', false);
                  }
              }
          },
          cells: function(row,col,prop) {
            var cellProperties = {},
                inspect = this.instance.getDataAtCell(row, col);
            // Detect unusually high employment values
            if (row < 10 && col < 7) {
                if (inspect > 10000) {
                    cellProperties.renderer = outsideRangeRenderer;
                } else {
                    cellProperties.renderer = normalRangeRenderer;
                }
            }
            if (inspect === '#') {
                cellProperties.readOnly = true;
                cellProperties.renderer = makeBlank;
                if (typeof col !== 'string') {
                    validFields[row][col] = 1;
                }
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

        // Enable/disable check button
        if (element.name === 'verify') {
            allValid.verify = element.checked;
            if (allValid.females && allValid.males && allValid.verify) {
                $('#submit').prop('disabled', false);
            } else {
                $('#submit').prop('disabled', true);
            }
        }

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
                if (verified){
                    var flat = flattenObj(retObj);
                    var maskObj = genMask(_.keys(flat));

                    // Zero-out any mask entries that correspond to zero
                    // entries in the data.
                    for (var key in flat)
                        maskObj[key] = (flat[key] > 0) ? maskObj[key] : 0;

                    var encryptedMask = encryptWithKey(maskObj, publickey);

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
                        user: CryptoJS.MD5(emailstr).toString(),
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
                            alert("Submitted data.");
                            console.log('returned: ', data);
                        },
                        error: function(){
                            waitingDialog.hide();
                            alert("Failed to submit data.");
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

// Parses CSV file into convenient format
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

// creates propertes of a blank cell
function makeBlank(instance, td, row, col, prop, value, cellProperties) {
    td.style.color = 'grey';
    td.style.background = 'grey';
}

function outsideRangeRenderer(instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.NumericRenderer.apply(this, arguments);
    td.style.background = '#f0e68c';
}

function normalRangeRenderer(instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.NumericRenderer.apply(this, arguments);
    td.style.background = '#fff';
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

// generates array of random numbers
function secureRandom(size){
    var array = new Uint32Array(size);
    window.crypto.getRandomValues(array);
    return array;
}

// creates random mask
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
