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

'use strict';

var LEX = require('letsencrypt-express');
var http = require('http');
var express = require('express');
var app = express();
var body_parser = require('body-parser');
var mongoose = require('mongoose');
var template = require('./template');
var aggregator = require('../shared/aggregate');
var crypto = require('crypto');

/*  Set server to staging for testing
    Set server to https://acme-v01.api.letsencrypt.org/directory for production
*/
var lex = LEX.create({
    server: 'staging',
    acme: require('le-acme-core').ACME.create(),
    challenge: require('le-challenge-fs').create({
        webrootPath: '~/letsencrypt/var/:hostname'
    }),
    store: require('le-store-certbot').create({
        configDir: '~/letsencrypt/etc',
        webrootPath: '~/letsencrypt/var/:hostname'
    }),
    approveDomains: approveDomains,
    debug: false
});

var server;

// Run on port 8080 without forced https for development
server = http.createServer(lex.middleware(app)).listen(8080, function () {
    console.log("Listening for ACME http-01 challenges on", this.address());
});

// handles acme-challenge and redirects to https
// http.createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
//     console.log("Listening for ACME http-01 challenges on", this.address());
// });

function approveDomains(opts, certs, cb) {
    if (!/\.100talent\.org$/.test(opts.domain) && opts.domain !== '100talent.org') {
        console.error("bad domain '" + opts.domain + "', not a subdomain of 100talent.org");
        cb(null, null);
        return;
    }

    if (certs) {
        opts.domains = certs.altnames;
    }
    else {
        opts.domains = ['100talent.org'];
        opts.email = 'fjansen@bu.edu';
        opts.agreeTos = true;
    }
    cb(null, { options: opts, certs: certs });
}

try {
    mongoose.connect('mongodb://localhost/aggregate');
} catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
}

// model for aggregate data
var Aggregate = mongoose.model('Aggregate', {
    _id: String,
    fields: Object,
    date: Number,
    session: Number,
    email: String
});
var Mask = mongoose.model('Mask', {_id: String, fields: Object, session: Number});
var PublicKey = mongoose.model('PublicKey', {
    _id: Number, session: Number,
    pub_key: String
});
var FinalAggregate = mongoose.model('FinalAggregate', {_id: Number, aggregate: Object, date: Number, session: Number});

// for parsing application/json
app.use(body_parser.json({limit: '50mb'}));

// serve static files in designated folders
app.use(express.static(__dirname + '/../client'));

app.use(express.static(__dirname + '/../'));

// protocol for accepting new data
app.post('/', function (req, res) {
    console.dir('Incoming data...');

    // verify that the json follows the schema as the data in the
    // database and is actually json.

    if (!(req.body.hasOwnProperty("mask") &&
        req.body.hasOwnProperty("data") &&
        req.body.hasOwnProperty("session") &&
        req.body.hasOwnProperty("user"))) {

        // TODO: change to send
        res.status(500).json({error: "All fields must be completed"});
        return;
    }

    // only take the fields that are in the template, mask, and data
    var to_add = {};
    for (var field in template) {
        if (template.hasOwnProperty(field) &&
            req.body.data.hasOwnProperty(field) &&
            req.body.mask.hasOwnProperty(field)) {

            to_add[field] = req.body.data[field];
        }
    }
    console.log(req.body.data);
    console.log(to_add);

    // save the mask and individual aggregate
    var agg_to_save = new Aggregate({
        _id: req.body.user, fields: to_add, date: Date.now(),
        session: req.body.session, email: req.body.user
    });

    var mask_to_save = new Mask({
        _id: req.body.user, fields: req.body.mask,
        session: req.body.session
    });

    // TODO: currently if aggregate.update succeeds but Mask.update fails, we're in trouble
    // below control flow is broken, add returns

    // for both the aggregate and the mask, update the old aggregate
    // for the company with that email. Update or insert, hence the upsert flag
    Aggregate.update({_id: req.body.user}, agg_to_save.toObject(), {upsert: true}, function (err) {
        if (err) {
            console.log(err);
            res.status(500).send('Unable to save aggregate, please try again');
        } else {
        }
    });

    Mask.update({_id: req.body.user}, mask_to_save.toObject(), {upsert: true}, function (err) {
        if (err) {
            console.log(err);
            res.status(500).send('Unable to save aggregate, please try again');
        } else {
        }
    });

    res.send(req.body);
});

// TODO: this should be a GET
// endpoint for fetching the public key for a specific session
app.post("/publickey", function (req, res) {
    PublicKey.findOne({session: req.body.session}, function (err, data) {
        if (err) {
            console.log(err);
            res.status(500).send('Error while fetching key.');
        }

        if (data == null) {
            res.status(500).send('No key found with the specified session ID');
        } else {
            res.send(data.pub_key);
        }
    });
});

// TODO: generate session ID server side
// endpoint for generating and saving the public key
app.post('/create_session', function (req, res) {
    console.log('POST /create_session');
    var publickey = req.body.publickey;        
    
    // TODO: switch to crypto.randomBytes
    var sessionID = Math.floor((Math.random() * 8999999) + 1000000);

    try {
        var new_key = new PublicKey({session: sessionID, pub_key: publickey, _id: sessionID});
        new_key.save(function (err) {
          if (err) {
            throw err;
          } else {
            console.log('Session generated...');
          }
        });
        res.json({sessionID: sessionID});
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Error during session creation.");
    }

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

            for (var row in data) {
                to_send[data[row].email] = data[row].date;
            }
            res.json(to_send);
        }
    });
});

// endpoint for getting all of the masks for a specific session
app.post('/get_masks', function (req, res) {
    console.log('POST to get_masks.');
    // console.log(req);
    Mask.where({session: req.body.session}).find(function (err, data) {
        // TODO: double-check js short circuiting
        if (!data || data.length === 0) {
            res.status(500).send('No submissions yet. Come back later.');
        }
        else {
            res.send({data: JSON.stringify(data)});
        }
    });
});

// endpoint for fetching the aggregate
// must pass in the session ID
// number for that key
app.post('/submit_agg', function (req, res) {
    var mask = req.body.data;

    console.log("Fetching aggregate");

    // finds all aggreagtes of a specific session
    Aggregate.where({session: req.body.session}).find(function (err, data) {
        console.log(data);
        // make sure query result is not empty
        if (data.length >= 1) {

            // create the aggregate of all of the submitted entries
            var final_data = aggregator.aggregate(data, false, true);
            final_data.then(function (value) {
                // TODO: get rid of _count check
                // subtract out the random data, unless it is a counter field
                for (var field in value)
                    if (mask.hasOwnProperty(field) && field.slice(field.length - 6, field.length) != '_count')
                        value[field] -= mask[field];

                console.log('Final aggregate computed.');

                var new_final = {_id: req.body.session, aggregate: value, date: Date.now(), session: req.body.session};
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
                res.json(value);
                return;
            });
        } 
        else {
            res.status(500).send("No submissions yet. Please come back later.");
        }

    });
});

// if the page isn't found, return 404 error
app.get(/.*/, function (req, res) {
    res.status(404).send('Page not found');
});

// require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
//   console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
// });

/*eof*/
