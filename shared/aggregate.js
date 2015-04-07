/***************************************************************
 *
 * aggregate.js
 *
 * Shared module for computing aggregates.
 *
 */

var MINIMUM = 2;

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

    // Determine which fields do not have enough non-zero data to be
    // included in the aggregate by counting up the number of non-zero
    // entries.
    var counts = {};
    for (var key in fields(data[0]))
        counts[key] = 0;
    for (var i = 0; i < data.length; i++)
        for (var key in counts)
            counts[key] += (convert(fields(data[i])[key]) > 0) ? 1 : 0;

    // Compute the aggregate
    var agg = {};
    for (var key in fields(data[0]))
        agg[key] = 0;
    for (var i = 0; i < data.length; i++)
        for (var key in agg)
            if (counts[key] >= MINIMUM)
                agg[key] += convert(fields(data[i])[key]);

    // Set the counts to zero if they weren't high enough.
    for (var key in counts)
        if (counts[key] < MINIMUM)
            counts[key] = 0;

    // Add the counts if requested.
    if (includeCounts)
        for (var key in fields(data[0]))
            agg[key + '_count'] = counts[key];

    return agg;
}

if (typeof module !== 'undefined')
    module.exports = {'aggregate': aggregate, 'MINIMUM': MINIMUM};

/*eof*/