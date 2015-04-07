/***************************************************************
 *
 * server/index.js
 *
 * Application server (serves requests and acts as database
 * front end).
 *
 */

/***************************************************************
** Module definition.
*/

var express = require('express');
var app = express();
var body_parser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var template = require('./template');
var aggregator = require('../shared/aggregate');

var port = 80;

try {
    mongoose.connect('mongodb://localhost/aggregate');
} catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
}

// model for aggregate data
var Aggregate = mongoose.model('Aggregate', { _id: String, fields: Object, date: Number, session: Number, email: String });
var Mask = mongoose.model('Mask', { _id: String, fields: Object, session: Number })
var PublicKey = mongoose.model('PublicKey', { _id: Number, session: Number,
    pub_key: String});
var FinalAggregate = mongoose.model('FinalAggregate', {_id: Number, aggregate: Object, date: Number, session: Number});

// for parsing application/json
app.use(body_parser.json());

// for parsing multipart/form-data
app.use(multer());

// serve static files in designated folders
app.use(express.static(__dirname + '/../client'));

app.use(express.static(__dirname + '/../'));

// protocol for accepting new data
app.post('/', function (req, res) {
    console.dir('Incoming data...');

    // verify that the json follows the schema as the data in the 
    // database and is actually json.

    if (  !(req.body.hasOwnProperty("mask") &&
        req.body.hasOwnProperty("data") &&
        req.body.hasOwnProperty("session") &&
        req.body.hasOwnProperty("user"))  ) {

        res.status(503).json({error: "All fields must be completed"});
    }

    // only take the fields that are in the template, mask, and data
    var to_add = {};
    for (field in template) {
        if ( template.hasOwnProperty(field) &&
            req.body.data.hasOwnProperty(field) &&
            req.body.mask.hasOwnProperty(field) ) {

            to_add[field] = req.body.data[field];
        }
    }

    // save the mask and individual aggregate
    var agg_to_save = new Aggregate({ _id: req.body.user, fields: to_add, date: Date.now(),
        session: req.body.session, email: req.body.user });

    var mask_to_save = new Mask({ _id: req.body.user, fields: req.body.mask,
        session: req.body.session });

    // for both the aggregate and the mask, update the old aggregate
    // for the company with that email. Update or insert, hence the upsert flag
    Aggregate.update({_id: req.body.user}, agg_to_save.toObject(), {upsert: true}, function (err) {
        if (err) {
            console.log(err);
            res.status(503).json({error: "Unable to save aggregate, please try again"});
        } else { }
    })

    Mask.update({_id: req.body.user}, mask_to_save.toObject(), {upsert: true}, function (err) {
        if (err) {
            console.log(err);
            res.status(503).json({error: "Unable to save aggregate, please try again"});
        } else { }
    })

    res.send(req.body);
});

// endpoint for fetching the public key for a specific session
app.post("/publickey", function (req,res) {
    PublicKey.findOne( {session: req.body.session }, function (err, data) {
        if (err) {
            console.log(err);
            res.send(err);
        }

        if (data == null ) {
            res.json({error: "No key found with the specified session ID"});
        } else {
            res.send(data.pub_key);
        }

    })
});

// endpoint for generating and saving the public key
app.post('/create_session', function (req, res) {
    console.log('Generating session...');
    try {
        var new_key = new PublicKey({session: req.body.session, pub_key: req.body.publickey, _id: req.body.session});
    } catch (err) {
        res.send(err);
    }

    // update and insert as to not generate different public keys for the same session
    PublicKey.update({_id: req.body.session}, new_key.toObject(), {upsert: true}, function (err) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.send();
        }
    })

});

// endpoint for returning the emails that have submitted already
app.post('/get_data', function (req, res) {
    console.log(req.body);

    // find all entries for a specific session and return the email and the time they submitted
    Aggregate.where({session: req.body.session}).gt('date', req.body.last_fetch).find(function (err, data) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            var to_send = {};

            for (row in data) {
                to_send[data[row].email] = data[row].date;
            }
            res.json(to_send);
        }
    });
})


// endpoint for getting all of the masks for a specific session
app.post('/get_masks', function (req, res) {
    Mask.where({session: req.body.session}).find(function (err, data) {
        res.send({ data: JSON.stringify(data) });
    });
})

// endpoint for fetching the aggregate
// must pass in the private key to decrypt the masks, as well as the session
// number for that key
app.post('/submit_agg', function (req, res) {
    var mask = req.body.data;

    console.log("Fetching aggregate");

    // finds all aggreagtes of a specific session
    Aggregate.where({session: req.body.session}).find(function (err, data) {

        // make sure there are enough companies that have submitted.
        // this ensures anonymity
        if (data.length >= aggregator.MINIMUM) {

            // create the aggregate of all of the submitted entries
            var final_data = aggregator.aggregate(data, true, true);

            // subtract out the random data
            for (field in final_data)
                if (mask.hasOwnProperty(field))
                    final_data[field] -= mask[field];

            console.log('Final aggregate computed.');

            var new_final = {_id: req.body.session, aggregate: final_data, date: Date.now(), session: req.body.session};
            var to_save = new FinalAggregate(new_final);

            console.log('Saving aggregate.');

            // save the final aggregate for future reference.
            // you can build another endpoint to query the finalaggregates collection if you would like
            FinalAggregate.update({_id: req.body.session}, to_save.toObject(), function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Aggregate saved and sent.');
                }
            });
            res.json(final_data);
        } else {
            res.json({error: "Too few people have submitted. Please come back later."})
        }

    });
})

// if the page isn't found, return 404 error
app.get(/.*/, function (req, res) {
    res.status(404).json({ error: 'Page not found' });
});

// start server
app.listen(port);

/*eof*/