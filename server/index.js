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

const LEX = require('greenlock-express');
const http = require('http');
const express = require('express');
const app = express();
const body_parser = require('body-parser');
const mongoose = require('mongoose');
const template = require('../client/app/data/tables');
const mpc = require('../client/app/helper/mpc');
const crypto = require('crypto');
const joi = require('joi');
const Promise = require('bluebird');
const base32Encode = require('base32-encode');
const path = require('path');
const compression = require('compression');

app.use(compression());

function templateToJoiSchema(template, joiFieldType) {
  template = template.tables;

  var schema = {};

  if (!template || template === undefined) {
    return joi.object().keys(schema);
  }
  for (var table of template) {

    schema[table['name']] = {};

    for (var row of table['rows']) {
      schema[table['name']][row['key']] = {};

      for (var col_levels of table['cols']) {
        for (var col of col_levels) {
          schema[table['name']][row['key']][col['key']] = joiFieldType
        }
      }
    }
  }
  return joi.object().keys(schema);
}

function genPairs(num) {
  var objPairs = {};
  for (var i = 0; i < num; i++) {
    for (var j = i + 1; j < num; j++) {
      objPairs[i + ':' + j] = 0;
    }
  }
  return objPairs;
}

const maskSchema = templateToJoiSchema(template, joi.number().required());
console.log(maskSchema);
const dataSchema = templateToJoiSchema(template, joi.number().required());
const encryptedPublicQuestionsSchema = templateToJoiSchema(template, joi.string().required());
const pairwiseHyperCubeScheme = templateToJoiSchema(genPairs(0), joi.string().required());

// Override deprecated mpromise
mongoose.Promise = Promise;

/*  Set server to staging for testing
 Set server to https://acme-v01.api.letsencrypt.org/directory for production
 */

var serverUrl = '';
if (process.env.NODE_ENV === 'production') {
  serverUrl = 'https://acme-v01.api.letsencrypt.org/directory';
} else {
  serverUrl = 'https://acme-staging.api.letsencrypt.org/directory';
}

var lex = LEX.create({
  server: serverUrl,
  challenges: {
    'http-01': require('le-challenge-fs').create({
      webrootPath: '/tmp/acme-challenges'
    })
  },
  version: 'v01',
  store: require('le-store-certbot').create({
    webrootPath: '/tmp/acme-challenges'
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
  if (!/\.pacesettersdata\.org$/.test(opts.domain) && opts.domain !== 'pacesettersdata.org') {
    console.error("bad domain '" + opts.domain + "', not a subdomain of pacesettersdata.org");
    cb(null, null);
    return;
  }

  if (certs) {
    opts.domains = certs.altnames;
  }
  else {
    opts.domains = ['www.pacesettersdata.org', 'pacesettersdata.org'];
    opts.email = 'fjansen@bu.edu';
    opts.agreeTos = true;
  }
  cb(null, {options: opts, certs: certs});
}

async function createConnection() {
  try {
    await mongoose.connect('mongodb://localhost/aggregate', {
      useMongoClient: true
    });
  } catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
  }
}

createConnection();

// model for aggregate data
var Aggregate = mongoose.model('Aggregate', {
  _id: String, // concat of session + user.
  fields: Object,
  date: Number,
  session: String,
  email: String
});
var Mask = mongoose.model('Mask', {
  _id: String, // concat of session + user.
  fields: Object,
  // questions_public: Object,
  session: String
});
var Cube = mongoose.model('Cubes', {
  _id: String, // concat of session + user.
  fields: Object,
  session: String
});
var SessionInfo = mongoose.model('SessionInfo', {
  _id: String,
  session: String,
  pub_key: String,
  password: String,
  title: String,
  description: String
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

var SessionStatus = mongoose.model('SessionStatus', {
  _id: String, // = session
  status: String
});


// Verifies that the given session and password match.
function verify_password(session, password, success, fail) {
  SessionInfo.findOne({session: session, password: password}, function (err, data) {
    if (err) {
      fail('Error while verifying password.');
    } else if (data == null) {
      fail('Invalid session/password');
    } else {
      success();
    }
  });
}

// Verifies that the given session and password match.
function verify_status(session, status, success, fail) {
  SessionStatus.findOne({_id: session}, function (err, data) {
    if (err) {
      fail('Error while verifying participation code.');
    }

    var db_status = "PAUSE";
    if (data) {
      db_status = data.status;
    }

    if (status === db_status) {
      success();
    } else {
      fail("Session status is " + db_status);
    }
  });
}

// for parsing application/json
app.use(body_parser.json({limit: '50mb'}));

// serve static files in designated folders
app.use(express.static(__dirname + '/../client'));

app.get('/', function (req, res) {
  res.sendFile((path.join(__dirname + '/../client/index.html')));
});

app.get('/session', function (req, res) {
  res.sendFile((path.join(__dirname + '/../client/create.html')));
});

app.get('/create', function (req, res) {
  res.sendFile((path.join(__dirname + '/../client/create.html')));
});

app.get('/track', function (req, res) {
  res.sendFile((path.join(__dirname + '/../client/manage.html')));
});

app.get('/manage', function (req, res) {
  res.sendFile((path.join(__dirname + '/../client/manage.html')));
});

app.get('/unmask', function (req, res) {
  res.sendFile((path.join(__dirname + '/../client/unmask.html')));
});

app.get('/definitions', function (req, res) {
  res.sendFile((path.join(__dirname + '/../client/definitions.html')));
});

// protocol for accepting new data
app.post('/', function (req, res) {
  console.log('POST /');

  var body = req.body;
  console.log(body);


  // TODO: set length restrictions on session and user
  var bodySchema = {
    mask: maskSchema.required(),
    data: dataSchema.required(),
    questions_public: encryptedPublicQuestionsSchema.required(),
    pairwise_hypercubes: pairwiseHyperCubeScheme.required(),
    session: joi.string().alphanum().required(),
    user: joi.string().alphanum().required()
  };

  joi.validate(body, bodySchema, function (err, body) {
    if (err) {
      console.log(err);
      res.status(500).send('Missing or invalid fields.');
      return;
    }

    var fail = function (err) {
      console.log(err);
      res.status(500).send(err);
    };
    var success = function () {
      console.log('Validation passed.');

      var mask = body.mask,
        req_data = body.data,
        // questions_public = body.questions_public,
        pairwise_hypercubes = body.pairwise_hypercubes,
        session = body.session,
        user = body.user,
        ID = session + user; // will use concat of user + session for now

      // Ensure user key exists.
      UserKey.findOne({_id: ID}, function (err, data) {
        if (err) {
          console.log(err);
          res.status(500).send('Error while verifying participation code.');
          return;
        }

        if (data == null) {
          res.status(500).send('Invalid participation code.');
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
            // questions_public: questions_public,
            session: session
          });

          var cubeToSave = new Cube({
            _id: ID,
            fields: pairwise_hypercubes,
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
            ),
            cubePromise = Cube.update(
              {_id: ID},
              cubeToSave.toObject(),
              {upsert: true}
            );

          Promise.join(aggPromise, maskPromise, cubePromise)
            .then(function (aggStored, maskStored, cubeStored) {
              res.send(body);
              return;
            })
            .catch(function (err) {
              console.log(err);
              res.status(500).send('Unable to save aggregate, please try again.');
              return;
            });
        }
      });
    };

    verify_status(body.session, "START", success, fail);
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
      res.status(500).send('Invalid request.');
      return;
    }

    var mask = body.mask,
      req_data = body.data,
      session = body.session,
      user = body.user;

    SessionInfo.findOne({session: body.session}, function (err, data) {
      if (err) {
        console.log(err);
        res.status(500).send('Error while fetching session.');
        return;
      }
      if (data == null) {
        res.status(500).send('Session is not found.');
      } else {
        res.send(data.pub_key);
      }
    });
  });
});

// endpoint for verifying user and session key and getting the session info.
app.post("/sessioninfo", function (req, res) {
  console.log('POST /sessioninfo');
  console.log(req.body);
  var schema = {
    session: joi.string().alphanum().required(),
    userkey: joi.string().alphanum().required()
  };

  joi.validate(req.body, schema, function (valErr, body) {
    if (valErr) {
      console.log(valErr);
      res.status(500).send('Invalid request.');
      return;
    }

    var session = body.session;
    var userkey = body.userkey;
    var ID = session + userkey;

    UserKey.findOne({_id: ID}, function (err, data) {
      if (err) {
        console.log(err);
        res.status(500).send('Error while fetching data.');
        return;
      }

      if (data == null) {
        res.status(500).send('Invalid session key or participation code key');
      } else {
        SessionInfo.findOne({session: session}, function (err, data) {
          if (err) {
            console.log(err);
            res.status(500).send('Error while fetching data.');
            return;
          }
          if (data == null) {
            res.status(500).send('Invalid session key.');
          } else {
            res.send({title: data.title, description: data.description});
          }
        });
      }
    });
  });
});

// endpoint for generating and saving the public key
app.post('/create_session', function (req, res) {
  console.log('POST /create_session');
  console.log(req.body);

  // TODO: should be more restrictive here
  var schema = {
    publickey: joi.string().required(),
    title: joi.string().required(),
    description: joi.string().required()
  };

  joi.validate(req.body, schema, function (valErr, body) {
    if (valErr) {
      console.log(valErr);
      res.status(500).send('Invalid public key.');
      return;
    }

    var publickey = body.publickey;
    var sessionID = base32Encode(crypto.randomBytes(16), 'Crockford').toString().toLowerCase();
    var password = base32Encode(crypto.randomBytes(16), 'Crockford').toString().toLowerCase();

    var title = body.title.split("<").join("&lt;").split(">").join("&gt;");
    var description = body.description.split("<").join("&lt;").split(">").join("&gt;");

    var sessInfo = new SessionInfo({
      _id: sessionID,
      session: sessionID,
      pub_key: publickey,
      password: password,
      title: title,
      description: description
    });

    sessInfo.save(function (err) {
      if (err) {
        console.log(err);
        res.status(500).send('Error during session creation.');
      }
      else {
        console.log('Session generated for:', sessionID);
        res.json({sessionID: sessionID, password: password});
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
    var fail = function (err) {
      console.log(err);
      res.status(500).send(err);
    };
    var success = function () {
      UserKey.where({session: body.session}).find(function (err, data) {
        if (err) {
          console.log(err);
          res.status(500).send('Error getting participation codes.');
          return;
        }

        var count = body.count;
        var session = body.session;

        // Store the UserKeys, userKey models, and urls.
        var urls = [];
        var userkeys = [];
        var models = [];
        if (!data) {
          data = [];
        }

        for (var d in data) {
          userkeys.push(d.userkey);
        }

        // Create count many unique (per session) user keys.
        for (var i = 0; i < count; i++) {
          var userkey = base32Encode(crypto.randomBytes(16), 'Crockford').toString().toLowerCase();

          // If user key already exists, repeat.
          if (userkeys.indexOf(userkey) > -1) {
            i--;
            continue;
          }

          // parameter portion of url.
          var url = "?session=" + session + "&participationCode=" + userkey;
          urls.push(url);

          // UserKey model.
          var model = new UserKey({
            _id: session + userkey,
            session: session,
            userkey: userkey
          });
          models.push(model);
        }

        console.log(urls);
        // Save the userkeys into the db.
        UserKey.insertMany(models, function (error, docs) {
          if (err) {
            console.log(err);
            res.status(500).send("Error during storing keys.");
          }
          else {
            console.log('URLs generated:', session);
            res.json({result: urls});
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
    var fail = function (err) {
      console.log(err);
      res.status(500).send(err);
    };
    var success = function () {
      UserKey.where({session: body.session}).find(function (err, data) {
        if (err) {
          console.log(err);
          res.status(500).send('Error getting client urls.');
          return;
        }

        if (!data) {
          data = [];
        }
        var urls = [];
        for (var d in data) {
          var url = "?session=" + body.session + "&participationCode=" + data[d].userkey;
          urls.push(url);
        }

        console.log('URLs fetched:', body.session);
        res.json({result: urls});
      });
    };

    verify_password(body.session, body.password, success, fail);
  });
});

// endpoint for returning the emails that have submitted already
app.post('/get_data', function (req, res) {

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
    var fail = function (err) {
      console.log(err);
      res.status(500).send(err);
    };
    var success = function () {
      Aggregate.where({session: body.session}).gt('date', body.last_fetch).find(function (err, data) {
        if (err) {
          console.log(err);
          res.status(500).send('Failed to fetch contributors.');
          return;
        } else {
          var to_send = [];
          for (var row in data) {
            to_send.push(data[row].date);
          }
          res.json({result: to_send});
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

    var fail = function (err) {
      console.log(err);
      res.status(500).send(err);
    };
    var success = function () {
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

    verify_password(body.session, body.password, function () {
      verify_status(body.session, "STOP", success, fail);
    }, fail);
  });

});

// endpoint for getting all of the cubes for a specific session
app.post('/get_cubes', function (req, res) {
  console.log('POST to get_cubes.');
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

    var fail = function (err) {
      console.log(err);
      res.status(500).send(err);
    };
    var success = function () {
      Cube.where({session: body.session}).find(function (err, data) {
        if (err) {
          console.log(err);
          res.status(500).send('Error getting cubes.');
          return;
        }
        if (!data || data.length === 0) {
          res.status(500).send('No submissions yet. Please come back later.');
          return;
        }
        else {
          console.log(data.length);
          var result = {};
          for (var i = 0; i < 5; i++) {
            for (var j = i + 1; j < 5; j++) {
              result[i + ":" + j] = [];
            }
          }

          for (var d = 0; d < data.length; d++) {
            var one_submission = data[d].fields;
            for (var i = 0; i < 5; i++) {
              for (var j = i + 1; j < 5; j++) {
                result[i + ":" + j].push(one_submission[i + ":" + j]);
              }
            }
          }

          // Sort (to shuffle/remove order) pairs
          // now it cannot be inferred which pairs are from the same submission.
          for (var i = 0; i < 5; i++) {
            for (var j = i + 1; j < 5; j++) {
              result[i + ":" + j] = result[i + ":" + j].sort();
            }
          }

          res.send(result);
          return;
        }
      });
    };

    verify_password(body.session, body.password, function () {
      verify_status(body.session, "STOP", success, fail);
    }, fail);
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

    var fail = function (err) {
      console.log(err);
      res.status(500).send(err);
    };
    var success = function () {
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

    verify_password(body.session, body.password, function () {
      verify_status(body.session, "STOP", success, fail);
    }, fail);
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

// status
app.post("/change_status", function (req, res) {
  console.log('POST /change_status');
  var schema = {
    session: joi.string().alphanum().required(),
    password: joi.string().alphanum().required(),
    status: joi.string().alphanum().required()
  };

  // Validate request.
  joi.validate(req.body, schema, function (valErr, body) {
    if (valErr) {
      console.log(valErr);
      res.status(500).send('Invalid request.');
      return;
    }

    // Get all previously generated user keys.
    var fail = function (err) {
      console.log(err);
      res.status(500).send(err);
    };
    var success = function () {
      SessionStatus.findOne({_id: body.session}, function (err, data) {
        if (err) {
          console.log(err);
          res.status(500).send('Error getting session status.');
          return;
        }

        if (data !== null && data.status === "STOP") {
          res.status(500).send('Session already stopped.');
          return;
        }
        var status = body.status;
        if (status !== 'START' && status !== 'PAUSE' && status !== 'STOP') {
          res.status(500).send('Illegal Session Status');
          return;
        }
        var session = body.session;

        var model = new SessionStatus({
          _id: session,
          status: status
        });

        SessionStatus.update(
          {_id: session},
          model,
          {upsert: true}
        ).then(function (status) {
          console.log('Current Session Status:', status);
          res.json({result: status});
        }).catch(function (error) {
          console.log(error);
          res.status(500).send('Error during session status update.');
        });

      });
    };

    verify_password(body.session, body.password, success, fail);
  });
});

// endpoint for storing the encrypted result
app.post('/fetch_status', function (req, res) {
  console.log('POST /fetch_status');
  console.log(req.body);

  var schema = {
    session: joi.string().alphanum().required()
  };

  // Validate request.
  joi.validate(req.body, schema, function (valErr, body) {
    if (valErr) {
      console.log(valErr);
      res.status(500).send('Invalid request.');
      return;
    }

    SessionStatus.findOne({_id: body.session}, function (err, data) {
      if (err) {
        console.log(err);
        res.status(500).send('Error getting session status.');
        return;
      }

      if (data === null) {
        data = {status: "PAUSE"};
      }

      if (data.status == null) {
        res.status(500).send('Session not found.');
        return;
      }

      res.send(data.status);
    });
  });
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
