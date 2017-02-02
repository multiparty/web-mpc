/***************************************************************
 *
 * client/script/ssCreate.js
 *
 * Creates a spreadsheet that is obfuscated with random numbers.
 * Dependancies: Handsontable.js, underscore.js, jquery
 * Author: Eric Dunton
 *
 */

var validateSum = function(enteredSum, values) {
  for (var i = 0; i < values.length; i++) {
    if (isNaN(values[i])) {
      return false;
    }
  }
  if (isNaN(enteredSum)) {
    return false;
  }

  var rowSum = values.map(function (val) {
    if (!Number.isInteger(val)) {
      return 0;
    }
    else {
      return val;
    }
  }).reduce(function(e1, e2) {
    return e1 + e2;
  });

  if (!Number.isInteger(enteredSum)) enteredSum = 0;
  
  return rowSum === enteredSum;
};

var makeTable = function (divID, tableConfig) {
  var hotElement = document.querySelector(divID);
  var hotSettings = {
    data: tableConfig.dummyFields,
    width: 1024,
    columns: tableConfig.columns,
    rowHeaders: tableConfig.rowHeaders,
    nestedHeaders: tableConfig.nestedHeaders,
    maxRows: tableConfig.totalsRowIdx + 1,
    maxCols: tableConfig.totalsColIdx + 1,
    afterChange: function (changes, source) {
      this.validateCells();
    },
    afterValidate: function (isValid, value, row, prop, source) {
      var isChecked = document.querySelector('#verify').checked,
          col = this.propToCol(prop);
      if (isChecked) {
        if (col === tableConfig.totalsColumnIdx 
          && row < tableConfig.totalsRowIdx) {
          var rowValues = this.getData(row, 0, row, col - 1)[0];
          return validateSum(value, rowValues);
        }
        else if (row === tableConfig.totalsRowIdx 
          && col !== tableConfig.totalsColumnIdx) {
          var colValues = this.getData(0, col, row - 1, col).map(function (val) {
            return val[0];
          });
          return validateSum(value, colValues);
        }
      }
    }
  };
  var hot = new Handsontable(hotElement, hotSettings);
  var verifyBox = document.querySelector('#verify');
  Handsontable.Dom.addEvent(verifyBox, 'click', function (event) {
    hot.validateCells();
  });
};

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
  var cryptoObj = window.crypto || window.msCrypto; // IE 11 fix
  cryptoObj.getRandomValues(array);
  return array;
}

// creates random mask
function genMask(keys){
  return _.object(keys, secureRandom(keys.length));
}

function encryptWithKey(obj, key) {
  var pki = forge.pki;
  var publicKey = pki.publicKeyFromPem(key);

  return _.mapObject(obj, function(x,k) {
    return publicKey.encrypt(x.toString(), 'RSA-OAEP', {
    md: forge.md.sha256.create()
    })
  });
}

/*eof*/
