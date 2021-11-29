/**
 * Server static files.
 */

const express = require('express');
const path = require('path');

const config = require('./config/config.js');

module.exports = function (app) {
  // serve static files in designated folders
  app.get('/', function (req, res) {
    // /client/index.html
    res.render('index.html', config.client);
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
    // /client/unmask.html
    res.render('unmask.html', config.client);
  });

  app.get('/definitions', function (req, res) {
    res.sendFile((path.join(__dirname + '/../client/definitions.html')));
  });

  app.use(express.static(__dirname + '/../client'));
  app.use('/jiff', express.static(__dirname + '/../jiff/dist'));
  app.use('/jiff/ext', express.static(__dirname + '/../jiff/lib/ext'));
  app.use('/bignumber.js', express.static(__dirname + '/../jiff/node_modules/bignumber.js'));
};
