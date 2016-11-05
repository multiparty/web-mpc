/***************************************************************
 *
 * aggregate.js
 *
 * Shared module for computing aggregates.
 *
 */

var MINIMUM = 0;

function aggregate(data, includeCounts, db) {

    // By default, do not include counts.
    if (includeCounts == null)
        includeCounts = false;

    // By default, this is not for the database calculation.
    if (db == null)
        db = false;

    // Access fields in JSON object or in DB object.
    var fields = db ? function(x){return x.fields;} : function(x){return x;};
    var convert = db ? function(x){return x;} : parseInt;

    // Ensure we are always working with an array.
    if (db) {
        var arr = [];
        for (row in data)
            arr.push(data[row]);
        data = arr;
    }
    var promises = [];

    // Determine which fields do not have enough non-zero data to be
    // included in the aggregate by counting up the number of non-zero
    // entries.
    var counts = {};
    for (var key in fields(data[0]))
        counts[key] = 0;
    for (var i = 0; i < data.length; i++) {
        // Use let so that key isn't mutable for closure
        // Otherwise it only uses the last object key
        for (let key in counts) {
            promises.push(Promise.resolve(fields(data[i])[key]).then(function (value) {
                counts[key] += convert(value) > 0 ? 1 : 0;
            }));
        }
    }


    // Compute the aggregate.
    var agg = {};
    for (var key in fields(data[0]))
        agg[key] = 0;
    for (var i = 0; i < data.length; i++)
        for (let key in agg)
            if (counts[key] >= MINIMUM) {
                promises.push(Promise.resolve(fields(data[i])[key]).then(function (value) {
                    agg[key] += convert(value);
                }));
            }

    return Promise.all(promises)
      .then(function () {
          // Set the counts to zero if they weren't high enough.
          for (var key in counts)
              if (counts[key] < MINIMUM)
                  counts[key] = 0;

          // Add the counts if requested.
          if (includeCounts)
              for (var key in fields(data[0]))
                  agg[key + '_count'] = counts[key];

          return agg;
      });
}

if (typeof module !== 'undefined')
    module.exports = {'aggregate': aggregate, 'MINIMUM': MINIMUM};

/*eof*/
