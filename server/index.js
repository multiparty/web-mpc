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

function templateToJoiSchema(template, joiFieldType) {
    var schema = {};
    for (var key in template) {
        if (template.hasOwnProperty(key)) {
          if(template[key] === 0)
            schema[key] = joiFieldType; // safe to re-use since immutable
          else // since format may have nested objects, recurse!
            schema[key] = templateToJoiSchema(template[key], joiFieldType);
        }
    }
    var joiSchema = joi.object().keys(schema);
    return joiSchema;
}

var LEX = require('greenlock-express');
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
var base32Encode = require('base32-encode');
var maskSchema = templateToJoiSchema(template, joi.string().required());
var dataSchema = templateToJoiSchema(template, joi.number().required());

// Override deprecated mpromise
mongoose.Promise = Promise;

/*  Set server to staging for testing
    Set server to https://acme-v01.api.letsencrypt.org/directory for production
*/

var serverUrl = '';
if (process.env.NODE_ENV === 'production') {
    serverUrl = 'https://acme-v01.api.letsencrypt.org/directory';
} else {
    serverUrl = 'staging';
}

var lex = LEX.create({
    server: serverUrl,
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

if (process.env.NODE_ENV === 'production') {
    //handles acme-challenge and redirects to https
    http.createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
        console.log("Listening for ACME http-01 challenges on", this.address());
    });
} else {
    // Run on port 8080 without forced https for development
    server = http.createServer(lex.middleware(app)).listen(8080, function () {
        console.log("Listening for ACME http-01 challenges on", this.address());
    });
}


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
var SessionInfo = mongoose.model('SessionInfo', {
    _id: String,
    session: String,
    pub_key: String,
    password: String
});
var FinalAggregate = mongoose.model('FinalAggregate', {
    _id: String,
    aggregate: Object,
    date: Number,
    session: String
});
var UserKey = mongoose.model('UserKey', {
    _id: String, // concat of session + user.
    session: String,
    userkey: String
});


// Verifies that the given session and password match.
function verify_password(session, password, success, fail) {
    SessionInfo.findOne({session: session, password: password}, function (err, data) {
        if (err)
            fail('Error while verifying user key.');
        else if (data == null)
            fail('Invalid session/password');
        else
            success();
    });
}

// for parsing application/json
app.use(body_parser.json({limit: '50mb'}));

// serve static files in designated folders
app.use(express.static(__dirname + '/../client'));

app.use(express.static(__dirname + '/../'));

// protocol for accepting new data
app.post('/', function (req, res) {
    console.log('POST /');

    var body = req.body;
    console.log(body);

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
            req_data = body.data,
            session = body.session,
            user = body.user,
            ID = session + user; // will use concat of user + session for now

        // Ensure user key exists.
        UserKey.findOne({_id: ID}, function (err, data) {
            if (err) {
                console.log(err);
                res.status(500).send('Error while verifying user key.');
                return;
            }

            if (data == null) {
                res.status(500).send('Invalid user key');
            } else { // User Key Found.
                // save the mask and individual aggregate
                var aggToSave = new Aggregate({
                    _id: ID,
                    fields: req_data,
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
        SessionInfo.findOne({session: body.session}, function (err, data) {
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
        var sessionID = base32Encode(crypto.randomBytes(16), 'Crockford');
        var password = base32Encode(crypto.randomBytes(16), 'Crockford');

        var sessInfo = new SessionInfo({
            _id: sessionID,
            session: sessionID,
            pub_key: publickey,
            password: password
        });

        sessInfo.save(function (err) {
            if (err) {
                console.log(err);
                res.status(500).send("Error during session creation.");
                return;
            }
            else {
                console.log('Session generated for:', sessionID);
                res.json({sessionID: sessionID, password: password});
                return;
            }
        });
    });
});

// endpoint for generating client unique urls
app.post('/generate_client_urls', function (req, res) {
    console.log('POST /generate_client_urls');
    console.log(req.body);

    // Max number of clients: 10 000
    var schema = {
      count: joi.number().integer().min(0).max(10000).required(),
      session: joi.string().alphanum().required(),
      password: joi.string().alphanum().required()
    };

    // Validate request.
    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid request.');
            return;
        }

        // Get all previously generated user keys.
        var fail = function(err) { console.log(err); res.status(500).send(err); };
        var success = function() {
            UserKey.where({session: body.session}).find(function (err, data) {
                if (err) {
                    console.log(err);
                    res.status(500).send('Error getting user keys.');
                    return;
                }

                var count = body.count;
                var session = body.session;

                // Store the UserKeys, userKey models, and urls.
                var urls = [];
                var userkeys = [];
                var models = [];
                if (!data) data = [];

                for(var d in data)
                    userkeys.push(d.userkey);

                // Create count many unique (per session) user keys.
                for(var i = 0; i < count; i++) {
                    var userkey = base32Encode(crypto.randomBytes(16), "Crockford");

                    // If user key already exists, repeat.
                    if(userkeys.indexOf(userkey) > -1) {
                        i--;
                        continue;
                    }

                    // parameter portion of url.
                    var url = "?sessionkey="+session+"&userkey="+userkey;
                    urls.push(url);

                    // UserKey model.
                    var model = new UserKey({
                        _id: session+userkey,
                        session: session,
                        userkey: userkey
                    });
                    models.push(model);
                }

                console.log(urls);
                // Save the userkeys into the db.
                UserKey.insertMany(models, function(error, docs) {
                    if (err) {
                        console.log(err);
                        res.status(500).send("Error during storing keys.");
                        return;
                    }
                    else {
                        console.log('URLs generated:', session);
                        res.json({result: urls});
                        return;
                    }
                });
            });
        };

        verify_password(body.session, body.password, success, fail);
    });
});

// endpoint for getting already generated client unique urls
app.post('/get_client_urls', function (req, res) {
    console.log('POST /get_client_urls');
    console.log(req.body);

    var schema = {
        session: joi.string().alphanum().required(),
        password: joi.string().alphanum().required()
    };

    // Validate request.
    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid request.');
            return;
        }

        // Get all previously generated user keys.
        var fail = function(err) { console.log(err); res.status(500).send(err); };
        var success = function() {
            UserKey.where({session: body.session}).find(function (err, data) {
                if (err) {
                    console.log(err);
                    res.status(500).send('Error getting client urls.');
                    return;
                }

                if (!data) data = [];
                var urls = [];
                for(var d in data) {
                    var url = "?sessionkey="+body.session+"&userkey="+data[d].userkey;
                    urls.push(url);
                }

                console.log('URLs fetched:', body.session);
                res.json({result: urls});
                return;
            });
        };

        verify_password(body.session, body.password, success, fail);
    });
});

// endpoint for returning the emails that have submitted already
app.post('/get_data', function (req, res) {
    console.log('POST /get_data');
    console.log(req.body);

    var schema = {
        session: joi.string().alphanum().required(),
        password: joi.string().alphanum().required(),
        last_fetch: joi.number().required() // TODO: enforce time stamp
    };

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid or missing fields.');
            return;
        }
        // find all entries for a specific session and return the email and the time they submitted
        var fail = function(err) { console.log(err); res.status(500).send(err); };
        var success = function() {
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
        };

        verify_password(body.session, body.password, success, fail);
    });

});

// endpoint for getting all of the masks for a specific session
app.post('/get_masks', function (req, res) {
    console.log('POST to get_masks.');
    console.log(req.body);

    var schema = {
      session: joi.string().alphanum().required(),
      password: joi.string().alphanum().required()
    };

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid or missing fields.');
            return;
        }

        var fail = function(err) { console.log(err); res.status(500).send(err); };
        var success = function() {
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
        };

        verify_password(body.session, body.password, success, fail);
    });

});

// endpoint for getting the service share of the result of the aggregation
app.post('/get_aggregate', function (req, res) {
    console.log('POST /get_aggregate');
    console.log(req.body);

    var schema = {
      session: joi.string().alphanum().required(),
      password: joi.string().alphanum().required()
    };

    joi.validate(req.body, schema, function (valErr, body) {
        if (valErr) {
            console.log(valErr);
            res.status(500).send('Invalid or missing fields.');
            return;
        }

        var fail = function(err) { console.log(err); res.status(500).send(err); };
        var success = function() {
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
        };

        verify_password(body.session, body.password, success, fail);
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

if (process.env.NODE_ENV === 'production') {
    require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
      console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
    });
}

/*eof*/
