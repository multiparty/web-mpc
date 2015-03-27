var express = require('express');
var app = express();
var body_parser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');

var port = 3000

try {
    mongoose.connect('mongodb://localhost/aggregate');
} catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
}

// for parsing application/json
app.use(body_parser.json());

// for parsing multipart/form-data
app.use(multer());

// serve static files in designated folders
app.use(express.static(__dirname + '/../client'));
app.use(express.static(__dirname + '/../'));

// an example of mongoose code
/*
var Cat = mongoose.model('Cat', {name: String});
var kitty = new Cat({name: 'wes'});
kitty.save(function (err) {
    if (err) {
        console.log(err);
    }
    console.log('meow');
});
*/


// model for aggregate data
var Aggregate = mongoose.model('Aggregate', { sum: Number, date: Number });


// protocol for accepting new data
app.post('/submit', function (req, res) {
    console.dir('Incoming data...');

    // verify that the json follows the schema as the data in the 
    // database and is actually json.

    if (req.is('json')) {

        var to_update;

        // fetch the old data
        var query = Aggregate.where('in_progress').equals(1)
                                .sort({ date: 'desc' })
                                .findOne( function (err, agg) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("Old dat:\n" + agg);
                                        to_update = agg;
                                    }
                                });

        // add new values to the data from the database
        for (var key in to_update) {
            if (to_update.hasOwnProperty(key) && res.body.hasOwnProperty(key)) {
                to_update[key] += res.body[key];
            }
        }

        // add date to the data
        to_update.date = Date.now();
        var new_data = new Aggregate(to_update);

        // Save the data
        new_data.save(function (err) {
            if (err) {
                console.log('\nError storing data\n');
            } else {
                console.log('Data stored');
            }
        });
    }

    // resend the data. #TODO not sure what to do here
    res.send(req.body);
});


// if the page isn't found, return 404 error
app.get(/.*/, function (req, res) {
    res.status(404).json({ error: 'Page not found' });
});

// start server
app.listen(port);
