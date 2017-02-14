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

function templateToJoiSchema(template, joiCls) {
    var schema = {};
    for (var key in template) {
        if (template.hasOwnProperty(key)) {
            schema[key] = joiCls().required();
        }
    }
    var joiSchema = joi.object().keys(schema);
    return joiSchema;
}

var LEX = require('letsencrypt-express');
var http = require('http');
var express = require('express');
var app = express();
var body_parser = require('body-parser');
var mongoose = require('mongoose');
var template = require('./template');
var aggregator = require('../shared/aggregate');
var crypto = require('crypto');
var joi = require('joi');
var Promise = require('bluebird');
var maskSchema = templateToJoiSchema(template, joi.string);
var dataSchema = templateToJoiSchema(template, joi.number);

// Override deprecated default mpromise 
mongoose.Promise = Promise;

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
    session: String,
    email: String
});
var Mask = mongoose.model('Mask', {
    _id: String, 
    fields: Object, 
    session: String
});
var PublicKey = mongoose.model('PublicKey', {
    _id: String, 
    session: String,
    pub_key: String
});
var FinalAggregate = mongoose.model('FinalAggregate', {
    _id: String, 
    aggregate: Object, 
    date: Number, 
    session: String
});

// for parsing application/json
app.use(body_parser.json({limit: '50mb'}));

// serve static files in designated folders
app.use(express.static(__dirname + '/../client'));

app.use(express.static(__dirname + '/../'));

// protocol for accepting new data
app.post('/', function (req, res) {
    console.log('POST /');
    
    var body = req.body;

    // TODO: set length restrictions on session and user
    var bodySchema = {
        mask: maskSchema.required(),
        data: dataSchema.required(),
        session: joi.string().alphanum().required(),
        user: joi.string().alphanum().required()
    };

    joi.validate(body, bodySchema, function (err, body) {
        if (err) {
            console.log(err);
            res.status(500).send('Missing or invalid fields');
            return;
        }

        console.log('Validation passed.');

        var mask = body.mask,
            data = body.data,
            session = body.session,
            user = body.user,
            ID = session + user; // will use concat of user + session for now

        // save the mask and individual aggregate
        var aggToSave = new Aggregate({
            _id: ID, 
            fields: data, 
            date: Date.now(),
            session: session, 
            email: user
        });

        var maskToSave = new Mask({
            _id: ID, 
            fields: mask,
            session: session
        });

        // for both the aggregate and the mask, update the old aggregate
        // for the company with that email. Update or insert, hence the upsert flag
        var aggPromise = Aggregate.update(
                    {_id: ID}, 
                    aggToSave.toObject(), 
                    {upsert: true}
                ),
            maskPromise = Mask.update(
                    {_id: ID}, 
                    maskToSave.toObject(),
                    {upsert: true}
                );

        Promise.join(aggPromise, maskPromise)
        .then(function (aggStored, maskStored) {
            res.send(body);
            return;
        })
        .catch(function (err) {
            console.log(err);
            res.status(500).send('Unable to save aggregate, please try again');
            return;
        });
    });
});

// endpoint for fetching the public key for a specific session
app.post("/publickey", function (req, res) {
    console.log('POST /publickey');
    console.log(req.body);
    var schema = {session: joi.string().alphanum().required()};

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Error while fetching key.');
            return;
        }
        PublicKey.findOne({session: body.session}, function (err, data) {
            if (err) {
                console.log(err);
                res.status(500).send('Error while fetching key.');
                return;
            }
            if (data == null) {
                res.status(500).send('No key found with the specified session ID');
            } else {
                res.send(data.pub_key);
            }
        });
    });
});

// endpoint for generating and saving the public key
app.post('/create_session', function (req, res) {
    console.log('POST /create_session');
    console.log(req.body);

    // TODO: should be more restrictive here
    var schema = {publickey: joi.string().required()};

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid public key.');
            return;
        }

        var publickey = body.publickey;
        var sessionID = crypto.randomBytes(16).toString('hex');
        
        var newKey = new PublicKey({
            _id: sessionID,
            session: sessionID, 
            pub_key: publickey 
        });

        newKey.save(function (err) {
            if (err) {
                console.log(err);
                res.status(500).send("Error during session creation.");
                return;
            }
            else {
                console.log('Session generated for:', sessionID);
                res.json({sessionID: sessionID});
                return;
            }
        });

    });
});

// endpoint for returning the emails that have submitted already
app.post('/get_data', function (req, res) {
    console.log('POST /get_data');
    console.log(req.body);
    
    var schema = {
        session: joi.string().alphanum().required(), 
        last_fetch: joi.number().required() // TODO: enforce time stamp
    };

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid or missing fields.');
            return;
        }
        // find all entries for a specific session and return the email and the time they submitted
        Aggregate.where({session: body.session}).gt('date', body.last_fetch).find(function (err, data) {
            if (err) {
                console.log(err);
                res.status(500).send('Failed to fetch contributors.');
                return;
            } else {
                var to_send = {};
                for (var row in data) {
                    to_send[data[row].email] = data[row].date;
                }
                res.json(to_send);
                return;
            }
        });
    });

});

// endpoint for getting all of the masks for a specific session
app.post('/get_masks', function (req, res) {
    console.log('POST to get_masks.');
    console.log(req.body);

    var schema = {session: joi.string().alphanum().required()};

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid or missing fields.');
            return;
        }
        Mask.where({session: body.session}).find(function (err, data) {
            if (err) {
                console.log(err);
                res.status(500).send('Error getting masks.');
                return;
            }
            if (!data || data.length === 0) {
                res.status(500).send('No submissions yet. Please come back later.');
                return;
            }
            else {
                res.send({data: JSON.stringify(data)});
                return;
            }
        });
    });

});

// endpoint for fetching the aggregate
// must pass in the session ID
// number for that key
app.post('/submit_agg', function (req, res) {
    console.log('POST /submit_agg');
    console.log(req.body);
    console.log("Fetching aggregate");

    var schema = {
        session: joi.string().alphanum().required(),
        data: dataSchema.required()
    };

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid or missing fields.');
            return;
        }

        var mask = body.data;
        // finds all aggreagtes of a specific session
        Aggregate.where({session: body.session}).find(function (err, data) {
            
            if (err) {
                console.log(err);
                res.status(500).send('Error computing aggregate.');
                return;
            }

            // make sure query result is not empty
            if (data.length >= 1) {

                // create the aggregate of all of the submitted entries
                var finalData = aggregator.aggregate(data, false, true);
                finalData.then(function (value) {
                    // TODO: get rid of _count check
                    // subtract out the random data, unless it is a counter field
                    for (var field in value) {
                        if (mask.hasOwnProperty(field) && 
                            field.slice(field.length - 6, field.length) != '_count') 
                        {
                            value[field] -= mask[field];                        
                        }
                    }

                    console.log('Final aggregate computed.');

                    var newFinal = {
                        _id: body.session, 
                        aggregate: value, 
                        date: Date.now(), 
                        session: body.session
                    };
                    var toSave = new FinalAggregate(newFinal);

                    console.log('Sending aggregate.');
                    // We want to send first, then save
                    res.json(value);

                    // Note that it's fine to do more processing
                    // after res.send as long as it doesn't use res
                    // to send more data

                    console.log('Saving aggregate.');
                    // save the final aggregate for future reference.
                    // you can build another endpoint to query the finalaggregates collection if you would like
                    FinalAggregate.update(
                        {_id: body.session},
                        toSave.toObject(),
                        {upsert: true},
                        function (upErr) {
                            if (upErr) {
                                console.log(upErr);
                            } else {
                                console.log('Aggregate saved.');
                            }
                        }
                    );
                }); // TODO: catch here?
            } 
            else {
                res.status(500).send("No submissions yet. Please come back later.");
                return;
            }
        });
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
