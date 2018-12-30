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

const production = require('./production.js');
const jiff = require('./jiff/create.js');

// Create express app
const app = require('./app.js');

// Create either an http for staging or https server for production
var server = production(app);

// JIFF
jiff(server);
