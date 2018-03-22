// Dependencies:
/*

<script src="/socket.io/socket.io.js"></script>
<script src="/bignumber.js/bignumber.min.js"></script>
<script src="/jiff/sodium.js"></script>
<script src="/jiff/jiff-client.js"></script>
<script src="/jiff/ext/jiff-client-bignumber.js"></script>

*/

// var masks: Array of form { fields: [], _id: user_id }
function reconstruct(masks, callback) {
  var mod = "18446744073709551557"; // 64 bits
  var old_mod = 1099511627776; // 40 bits
  var jiff_instance;

  var options = {party_count: 1, Zp: new BigNumber(mod), autoConnect: false };
  options.onConnect = function() {
    var numbers = [];
    for(var i = 0; i < masks.length; i++) {
      numbers[i] = {};
      for(var key in masks[i].fields) {
        if(!masks[i].fields.hasOwnProperty(key)) continue;
        var shares = jiff_instance.share(mask[i].fields[key], 2, [1, "s1"], [1, "s1"]);
        var recons = shares["s1"].sadd(shares[1]);
        recons = recons.ssub(recons.cgteq(old_mod, 43).cmult(old_mod));
        numbers[i][key] = recons;
      }
    }

    var results = {};
    for(var key in numbers[0]) {
      if(!numbers[0].hasOwnProperty(key)) continue;
      
      results[key] = numbers[0][key];
      for(var i = 1; i < masks.length; i++) {
        results[key] = results[key].sadd(numbers[i][key]);
      }
    }
    
    var promises = [];
    var keys = [];
    for(var key in results) {
      if(!results.hasOwnProperty(key)) continue;
      keys.push(key);
      promises.push(jiff_instance.open(results[key], [1]));
    };
    
    Promise.all(promises).then(function(results) {
      var final_results = {};
      for(var i = 0; i < keys.length; i++) {
        final_results[keys[i]] = results[i];
      }
      
      jiff_instance.disconnect();
      callback(final_results);
    });
  }

  var base_instance = require('../lib/jiff-client').make_jiff("http://localhost:3000", 'reconstruction-session', options);
  var jiff_instance = require('../modules/jiff-client-bignumber').make_jiff(base_instance, options)
  jiff_instance.connect();
}
