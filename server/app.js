/**
 * Main entry for defining the express app.
 * Routes are defined in ./routes.js
 */

const express = require('express');
const app = express();

// Allow maintaining a shared context between all API route handlers.
app.__context = {}; // Will be filled later by index.js
app.myPutContext = function (key, value) {
  app.__context[key] = value;
};

const compression = require('compression');
app.use(compression());

// for parsing application/json
const body_parser = require('body-parser');
app.use(body_parser.json({ limit: '50mb' }));

// view engine
var nunjucks = require( 'nunjucks' ) ;
nunjucks.configure(__dirname + '/../client/', {
  autoescape: true,
  express: app
});

// Server static files
require('./statics.js')(app);

// Define API routes
var routes = require('./routes.js');

// Helper: Executes any specified authentication functions in order
function authenticate(body, response, authentication, func) {
  if (authentication) {
    authentication(body, function (status, msg) {
      if (!status) { // could not authenticate!
        console.log(msg);
        response.status(500).send(msg);
        return;
      }

      func(app.__context, body, response, msg);
    });
  } else {
    func(app.__context, body, response);
  }
}

// Define POST routes matching routes map, validate request body using defined JOI validation schema.
for (var route of routes) {
  (function (route) { // scoping
    var url = route.url;
    var routeFunction = route.route;
    var validationSchema = route.validation;
    var authentication = route.authentication;

    // define POST route
    app.post(url, function (request, response) {
      // Log
      console.log('POST ' + url);
      console.log(request.body);

      // Validate request body
      var valResult = validationSchema.validate(request.body);
      if (valResult.error) {
        console.log(valResult.error);
        response.status(500).send('Invalid request.');
        return;
      }

      authenticate(valResult.value, response, authentication, routeFunction);
    });
  }(route));
}

// if the page isn't found, return 404 error
app.get(/.*/, function (req, res) {
  res.status(404).send('Page not found');
});

module.exports = app;
