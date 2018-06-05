// Dependencies:
/*

<script src="/socket.io/socket.io.js"></script>
<script src="/bignumber.js/bignumber.min.js"></script>
<script src="/jiff/sodium.js"></script>
<script src="/jiff/jiff-client.js"></script>
<script src="/jiff/ext/jiff-client-bignumber.js"></script>

*/

// var masks: Array of form { fields: [], _id: user_id }
define([], function () {
  function reconstruct(session, masks, callback) {
    if(window.crypto == undefined) window.crypto = window.msCrypto;
    var hostname = window.location.href;
    hostname = hostname.substring(0, hostname.lastIndexOf("/"));

    var mod = "18446744073709551557"; // 64 bits
    var jiff_instance;

    var options = {party_count: 1, party_id: 1, Zp: new BigNumber(mod), autoConnect: false };
    options.onConnect = function(jiff_instance) {
      jiff_instance.emit('begin', ["s1"], session);
      
      jiff_instance.listen('mods', function(_, mods) {
        // Agree on ordering on keys
        var keys = [];
        for(var key in masks[0]['Pacesetter Procurement Measure']) {
          if(!masks[0]['Pacesetter Procurement Measure'].hasOwnProperty(key)) continue;
          keys.push(key);
        }
        keys.sort();
        
        // unmask
        var numbers = [];
        for(var i = 0; i < masks.length; i++) {
          numbers[i] = {};
          mods[i] = new BigNumber(mods[i]);

          for(var j = 0; j < keys.length; j++) {
            var key = keys[j];

            var shares = jiff_instance.share(masks[i]['Pacesetter Procurement Measure'][key].value, 2, [1, "s1"], [1, "s1"]);
            var recons = shares["s1"].sadd(shares[1]);
            recons = recons.ssub(recons.cgteq(mods[i], 42).cmult(mods[i]));
            numbers[i][key] = recons;
          }
        }

        // sum
        var results = {};
        for(var j = 0; j < keys.length; j++) {
          var key = keys[j];
          
          results[key] = numbers[0][key];
          for(var i = 1; i < numbers.length; i++) {
            results[key] = results[key].sadd(numbers[i][key]);
          }
        }
        
        // open
        var promises = [];
        for(var i = 0; i < keys.length; i++) {
          var key = keys[i];
          promises.push(jiff_instance.open(results[key], [1]));
        };
        
        // process
        Promise.all(promises).then(function(results) {
          var final_results = {};
          for(var i = 0; i < keys.length; i++) {
            final_results[keys[i]] = { value: results[i].toString() };
          }
                  
          jiff_instance.disconnect();
          callback({'Pacesetter Procurement Measure': final_results});
        });
      
      });
    }

    var base_instance = jiff.make_jiff(hostname, 'reconstruction-session', options);
    var jiff_instance = jiff_bignumber.make_jiff(base_instance, options)
    jiff_instance.connect();
  }

  return { reconstruct: reconstruct };
});
