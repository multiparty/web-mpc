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

/*
* Helper functions--these don't belong here.
*/

function templateToJoiSchema (template, joiFieldType) {
    var schema = {};
    for (var key in template) {
        if (template.hasOwnProperty(key)) {
            schema[key] = joiFieldType; // safe to re-use since immutable
        }
    }
    var joiSchema = joi.object().keys(schema);
    return joiSchema;
}

// TODO: should this take in a session ID as well when not
// dealing with initiator?
function confirmAnalyst (email, initiatorEmail, nonce) {
    var query = {
        email: email, 
        initiator_email: initiatorEmail,
        nonce: nonce
    };
    return AnalystToken.findOne(query).exec().then(function (candidate) {
        if (!candidate) {
            throw new Error('Initiator not found or nonce mismatch.');
        }
        if (candidate.confirmed) {
            throw new Error('Already confirmed.');
        }
        return candidate;
    });
};

var LEX = require('letsencrypt-express');
var http = require('http');
var express = require('express');
var app = express();
var body_parser = require('body-parser');
var mongoose = require('mongoose');
var template = require('./template');
var mpc = require('../shared/mpc');
var crypto = require('crypto');
var joi = require('joi');
var Promise = require('bluebird');
var analystShareSchema = joi.object().keys({
    analystEmail: joi.string().email(),
    fields: templateToJoiSchema(template, joi.string().required())
});
var serviceShareSchema = templateToJoiSchema(template, joi.number().required());

// Override deprecated mpromise 
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

var AnalystToken = mongoose.model('AnalystToken', {
    _id: String,
    nonce: String,
    confirmed: Boolean,
    email: String,
    initiator_email: String
});

var Analyst = mongoose.model('Analyst', {
    _id: String,
    session: String,
    pub_key: String,
    email: String,
    initiator: Boolean
});

var AnalystShare = mongoose.model('AnalystShare', {
    _id: String, 
    fields: Object,
    date: Number, 
    session: String,
    cont_hash: String,
    analyst_email: String
});

var ServiceShare = mongoose.model('ServiceShare', {
    _id: String,
    fields: Object,
    date: Number,
    session: String,
    cont_hash: String
});

var ResultShare = mongoose.model('ResultShare', {
    _id: String, 
    fields: Object, 
    date: Number, 
    session: String,
    analyst_email: String
});

// for parsing application/json
app.use(body_parser.json({limit: '50mb'}));

// serve static files in designated folders
app.use(express.static(__dirname + '/../client'));

app.use(express.static(__dirname + '/../'));

app.post('/initiator_signup', function (req, res) {
    
    console.log('POST /initiator_signup');
    
    var body = req.body,
        bodySchema = {
            email: joi.string().email().required()
        };

    joi.validate(body, bodySchema, function (err, body) {
        if (err) {
            console.log(err);
            res.status(500).send('Missing or invalid fields');
            return;
        }

        var initiator_email = req.body.email,
            nonce = crypto.randomBytes(16).toString('hex'),
            ID = nonce + initiator_email; // will use concat of email + nonce for now

        // TODO: handle case when initiator already confirmed

        var token = new AnalystToken({
            _id: ID,
            nonce: nonce,
            confirmed: false,
            email: initiator_email,
            initiator_email: initiator_email
        });

        token.save()
        .then(function (value) {
            // TODO: email initiator token
            console.log('Token generated:', nonce, 'and sent to:', initiator_email);
            res.send(req.body);
            return;
        })
        .catch(function (err) {
            // TODO: check if key overlap and resend token in that case
            console.log(err);
            res.status(500).send("Something went wrong during initiator sign-up.");
            return;
        });

    });
});

app.post('/create_session', function (req, res) {
    console.log('POST /create_session');

    // TODO: be more restrictive in public-key and token joi validation
    var body = req.body,
        bodySchema = {
            email: joi.string().email().required(),
            nonce: joi.string().alphanum().required(),
            publickey: joi.string().required(),
            analystEmails: joi.array().items(joi.string().email()).required() 
        };

    joi.validate(body, bodySchema, function (err, body) {
        if (err) {
            console.log(err);
            res.status(500).send('Missing or invalid fields');
            return;
        }

        console.log(body);

        var initiatorEmail = body.email,
            initiatorToken = body.nonce,
            initiatorPK = body.publickey,
            analystEmails = body.analystEmails;

        // TODO: figure out way to roll back if there is a failure further down the workflow
        confirmAnalyst(initiatorEmail, initiatorEmail, initiatorToken)
        .then(function (candidate) {
            candidate.confirmed = true;
            var savedInitiator = candidate.save();

            var saved = analystEmails.map(function (email) {
                var invitedNonce = crypto.randomBytes(16).toString('hex'),
                    ID = invitedNonce + email,
                    invitedAnalystToken = new AnalystToken({
                        _id: ID,
                        nonce: invitedNonce,
                        confirmed: false,
                        email: email,
                        initiator_email: initiatorEmail
                    });
                return invitedAnalystToken.save();
            });
            saved.push(savedInitiator);
            return Promise.all(saved);
        })
        .then(function (allSaved) {
            // TODO: email analysts their tokens and session ID
            console.log(allSaved);
            var sessionID = crypto.randomBytes(16).toString('hex'),
                analyst = new Analyst({
                    _id: sessionID + initiatorEmail,
                    session: sessionID,
                    pub_key: initiatorPK,
                    email: initiatorEmail,
                    initiator: true
                });
            return analyst.save();
        })
        .then(function (savedInitiator) {
            return res.json({sessionID: savedInitiator.session});
        })
        .catch(function (err) {
            console.error(err);
            // TODO: think about how to roll back incomplete saved data
            return res.status(500).send('Error! Validation failed.');
        });
    });
});

// endpoint for ...
app.post('/join_session', function (req, res) {
    console.log('POST /join_session');

    var body = req.body,
        bodySchema = {
            analystEmail: joi.string().email().required(),
            nonce: joi.string().alphanum().required(),
            publickey: joi.string().required(),
            initiatorEmail: joi.string().email().required(),
            session: joi.string().alphanum().required(),            
        };

    joi.validate(body, bodySchema, function (err, body) {
        if (err) {
            console.log(err);
            res.status(500).send('Missing or invalid fields');
            return;
        }

        console.log(body);

        var analystEmail = body.analystEmail,
            analystToken = body.nonce,
            analystPK = body.publickey,
            initiatorEmail = body.initiatorEmail,
            session = body.session; 

        confirmAnalyst(analystEmail, initiatorEmail, analystToken)
        .then(function (candidate) {
            candidate.confirmed = true;            
            return candidate.save();
        })
        .then(function (updatedToken) {
            var analyst = new Analyst({
                    _id: session + analystEmail,
                    session: session,
                    pub_key: analystPK,
                    email: analystEmail,
                    initiator: false
                });
            return analyst.save();
        })
        .then(function (savedAnalyst) {
            return res.json(body);
        })
        .catch(function (err) {
            console.error(err);
            return res.status(500).send('Error! Failed to join session.');
        });
    });
});

// endpoint for fetching all analysts' details for a specific session
app.post("/analyst_details", function (req, res) {
    console.log('POST /analyst_details');

    var body = req.body,
        bodySchema = {session: joi.string().alphanum().required()};

    // TODO: prevent fetching details before all analysts have created keys.
    // For now this can be achieved by ensuring that initiator doesn't email
    // out session ID until all the analysts have signed up but obviously
    // this isn't ideal.

    joi.validate(body, bodySchema, function (err, body) {
        if (err) {
            console.log(err);
            res.status(500).send('Missing or invalid fields.');
            return;
        }

        var session = body.session;
        
        Analyst.find({session: session}, function (err, data) {
            if (err) {
                console.log(err);
                res.status(500).send('Error while fetching analyst details.');
                return;
            }
            else if (data == null) {
                res.status(500).send('No analyst found for session.');
                return;
            } 
            else {
                var details = data.map(function (analyst) {
                    return {email: analyst.email, publickey: analyst.pub_key};
                });
                res.json({all: details});
                return;
            }
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

// protocol for accepting new data
app.post('/', function (req, res) {

    console.log('POST /');
    
    var body = req.body,
        bodySchema = {
            serviceShare: serviceShareSchema.required(),
            analystShares: joi.array().items(analystShareSchema).required(),
            session: joi.string().alphanum().required(),
            contributorHash: joi.string().alphanum().required()
        };

    console.log(body);

    joi.validate(body, bodySchema, function (err, body) {
        
        if (err) {
            console.log(err);
            res.status(500).send('Missing or invalid fields');
            return;
        }

        var serviceShare = body.serviceShare,
            analystShares = body.analystShares,
            contributorHash = body.contributorHash,
            session = body.session;
        
        var svcShareToSave = new ServiceShare({
            _id: contributorHash + session,
            fields: serviceShare,
            date: Date.now(),
            session: session,
            cont_hash: contributorHash,
        });

        var analystSharesToSave = analystShares.map(function (share) {
            return new AnalystShare({
                _id:  session + contributorHash + share.analystEmail, 
                fields: share.fields,
                date: Date.now(),
                session: session,
                cont_hash: contributorHash,
                analyst_email: share.analystEmail
            });
        });

        var updatePromises = analystSharesToSave.map(function (share) {
            return AnalystShare.update(
                {_id: share._id}, 
                share.toObject(), 
                {upsert: true}  
            );
        });
        updatePromises.push(
            ServiceShare.update(
                {_id: svcShareToSave._id}, 
                svcShareToSave.toObject(), 
                {upsert: true}  
            )
        );

        Promise.all(updatePromises).then(function (allSaved) {
            return res.json(body);
        })
        .catch(function (err) {
            // TODO: Should roll back in case of error.
            console.log(err);
            return res.status(500).send('Failed to upload shares.');
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

// endpoint for getting the service share of the result of the aggregation
app.post('/get_aggregate', function (req, res) {
    console.log('POST /get_aggregate');
    console.log(req.body);
    
    var schema = {session: joi.string().alphanum().required()};

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid or missing fields.');
            return;
        }
        Aggregate.where({session: body.session}).find(function (err, data) {
            
            if (err) {
                console.log(err);
                res.status(500).send('Error computing aggregate.');
                return;
            }

            // make sure query result is not empty
            if (data.length >= 1) {
                console.log('Computing share of aggregate.');
                
                var invalidShareCount = mpc.countInvalidShares(data, true),
                    serviceShare = mpc.aggregateShares(data, true);
                
                // TODO: we should set a threshold and abort if there are too
                // many invalid shares
                console.log('Invalid share count:', invalidShareCount);

                console.log('Sending aggregate.');
                res.json(serviceShare);
                
                return;
            }
            else {
                res.status(500).send('No submissions yet. Please come back later.');
                return;
            }
        });

    });

});

// endpoint for storing the encrypted result
app.post('/submit_agg', function (req, res) {
    console.log('POST /submit_agg');
    console.log(req.body);
    console.log('Fetching aggregate');

    // TODO: implement
    res.status(500).send('Not implemented.');
});

// if the page isn't found, return 404 error
app.get(/.*/, function (req, res) {
    res.status(404).send('Page not found');
});

// require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
//   console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
// });

/*eof*/
