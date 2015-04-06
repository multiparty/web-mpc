var express = require('express');
var app = express();
var body_parser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var template = require('./template')

var port = 80

try {
    mongoose.connect('mongodb://localhost/aggregate');
} catch (err) {
    console.log('Could not connect to MongoDB server.\n');
    console.log(err);
}

// model for aggregate data
var Aggregate = mongoose.model('Aggregate', { _id: String, fields: Object, date: Number, session: Number, email: String });
var Mask = mongoose.model('Mask', { fields: Object, session: Number })
var PublicKey = mongoose.model('PublicKey', { _id: Number, session: Number,
    pub_key: String});
var FinalAggregate = mongoose.model('FinalAggregate', {_id: Number, aggregate: Object, date: Number, session: Number});

// for parsing application/json
app.use(body_parser.json());

// for parsing multipart/form-data
app.use(multer());

// serve static files in designated folders
app.use(express.static(__dirname + '/../client'));

app.post('/unmask', function (req, res) {

    var data = req.data;
    /*
    Aggregate.where({'in_progress'}).equals(1)
             .sort({ data: 'desc'})
             .findOne( function (err, agg) {
                 if (err) {
                     console.log(err);
                 } else {
                     console.log("Fetching data");

                     // figure out where json is in post
                     res.send(agg - req.body);
                 }
             });
    */
});


/*
app.get('/seed', function (req, res) {
    var test_key =  new PublicKey({ session: 123, pub_key: "123456\nabcdefg\nhello" });
    var test_data = test_key.toObject();
    delete test_data._id;

    PublicKey.update( {_id: test_data.session.toString()}, test_data, {upsert: true}, function (err) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.send("Done");
        }
    })

});

app.get('/testing', function (req, res) {

    var test;
    Aggregate.find({}, function (err, data) {
        if (err) {
            console.log(err);
        }
        console.log(data);
        res.send(data);
    });
})

app.get('/postit', function (req, res) {
    var test_data = new Aggregate({ fields: {"a": 1, "b": 2},
        date: Date.now(), session: 0});
    test_data.save(function (err) {
        if (err) {
            console.log(err);
        }
        console.log("finished saving data");
    });

    res.send("finished");
})
*/

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

    var to_add = {};
    for (field in template) {
        if ( template.hasOwnProperty(field) &&
            req.body.data.hasOwnProperty(field) &&
            req.body.mask.hasOwnProperty(field) ) {

            to_add[field] = req.body.data[field];
        }
    }

    var agg_to_save = new Aggregate({ _id: req.body.user, fields: to_add, date: Date.now(),
        session: req.body.session, email: req.body.user });

    var mask_to_save = new Mask({ fields: req.body.mask,
        session: req.body.session });

    Aggregate.update({_id: req.body.user}, agg_to_save.toObject(), {upsert: true}, function (err) {
        if (err) {
            console.log(err);
            res.status(503).json({error: "Unable to save aggregate, please try again"});
        } else { }
    })

    /*
    agg_to_save.save(function (err) {
        if (err) {
            res.status(503).json({error: "Unable to save aggregate, please try again"});
        }
    });
*/

    mask_to_save.save(function (err) {
        if (err) {
            res.status(404).json({error: "Unable to save your data, please try again"});
        }
    });

    res.send(req.body);
});

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

app.post('/create_session', function (req, res) {
    console.log('Generating session...');
    try {
        var new_key = new PublicKey({session: req.body.session, pub_key: req.body.publickey, _id: req.body.session});
    } catch (err) {
        res.send(err);
    }
    PublicKey.update({_id: req.body.session}, new_key.toObject(), {upsert: true}, function (err) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.send();
        }
    })

});

app.post('/get_data', function (req, res) {
    Aggregate.where({session: req.body.session}).gt('date', req.last_fetch).find(function (err, data) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            var to_send = {};

            for (row in data) {
                to_send[row.email] = row.date;
            }
            res.json(to_send);
        }
    });
})

app.post('/get_masks', function (req, res) {
    Mask.where({session: req.body.session}).find(function (err, data) {
        res.send({ data: JSON.stringify(data) });
    });
})

app.post('/submit_agg', function (req, res) {
    var mask = req.body.data;
    //console.log(req.body);
    console.log("Fetching aggregate");
    Aggregate.where({session: req.body.session}).find(function (err, data) {
        var final_data = {};
        for (row in data) {
            for (field in data[row].fields) {
                if (final_data[field] == undefined ){
                    final_data[field] = 0;
                } 
                final_data[field] += data[row].fields[field];
            }
        }

        for (field in final_data) {
            if (mask.hasOwnProperty(field) && final_data.hasOwnProperty(field)) {
                final_data[field] -= mask[field];
            }
        }

        console.log('Final aggregate conputed');

        var new_final = {_id: req.body.session, aggregate: final_data, date: Date.now(), session: req.body.session};
        var to_save = new FinalAggregate(new_final);

        
        console.log('Saving aggregate');

        FinalAggregate.update({_id: req.body.session}, to_save.toObject(), function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Aggregate saved and sent');
            }
        });
        res.json(final_data);

    });
})

// if the page isn't found, return 404 error
app.get(/.*/, function (req, res) {
    res.status(404).json({ error: 'Page not found' });
});

// start server
app.listen(port);
