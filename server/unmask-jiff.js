// var masks: Array of form { fields: [], _id: user_id }
function reconstruct_server(data, express) {
  var http = require('http').Server(express);  
  var base_instance = require('../../lib/jiff-server').make_jiff(http, {logs:false});
  var jiff_instance = require('../../lib/ext/jiff-server-bignumber').make_jiff(base_instance);  

  jiff_instance.compute('reconstruction-session', function(computation_instance) {
    var mod = "18446744073709551557"; // 64 bits
    var old_mod = 1099511627776; // 40 bits

    var numbers = [];
    for(var i = 0; i < data.length; i++) {
      numbers[i] = {};
      for(var key in data[i].fields) {
        if(!data[i].fields.hasOwnProperty(key)) continue;
        var shares = computation_instance.share(data[i].fields[key], 2, [1, "s1"], [1, "s1"]);
        var recons = shares["s1"].sadd(shares[1]);
        recons = recons.ssub(recons.cgteq(old_mod, 43).cmult(old_mod));
        numbers[i][key] = recons;
      }
    }

    var results = {};
    for(var key in numbers[0]) {
      if(!numbers[0].hasOwnProperty(key)) continue;
      
      results[key] = numbers[0][key];
      for(var i = 1; i < data.length; i++) {
        results[key] = results[key].sadd(numbers[i][key]);
      }
    }
    
    for(var key in results) {
      if(!results.hasOwnProperty(key)) continue;s
      computation_instance.open(results[key], [1]);
    };
}

// Server static files.
//app.use("/demos", express.static("demos"));
//app.use("/lib", express.static("lib"));
//app.use("/lib/ext", express.static("lib/ext"));
//app.use("/bignumber.js", express.static("node_modules/bignumber.js"));
//http.listen(8080, function() {
  //console.log('listening on *:8080');
//});

//console.log("Direct your browser to *:8080/demos/sum-fixed/client.html.");
//console.log()
