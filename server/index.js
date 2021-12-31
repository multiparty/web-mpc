/***************************************************************
 *
 * server/index.js
 *
 * Application server (serves requests and acts as database
 * front end).
 *
 * Set environment variable WEBMPC_DEPLOYMENT='deployment_name'
 * It is required that config/<deployment_name>.json be a valid
 * configuration file.
 *
 * Empty WEBMPC_DEPLOYMENT defaults to pacesetters.
 */

'use strict';

// Set deployment
let config = require('./config/config.js');
if (process.argv[2]) {
  config.setDeployment(process.argv[2]);
}

const production = require('./production.js');
const jiff = require('./jiff/create.js');

// Create express app
const app = require('./app.js');

// Create either an http for staging or https server for production
var server = production.create(app);

// JIFF
var jiffWrapper = new jiff(server, app);

// Store context
app.myPutContext('jiff', jiffWrapper);

jiffWrapper.ready.then(function () {
  console.log('JIFF state loaded!');
  production.listen(server);
}).catch(function (err) {
  console.log('Error loading JIFF state', err);
});
