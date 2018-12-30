/**
 * Server static files.
 */

const express = require('express');
const path = require('path');

module.exports = function (app) {
  // serve static files in designated folders
  app.use(express.static(__dirname + '/../client'));
  app.use('/jiff', express.static(__dirname + '/../jiff/lib'));
  app.use('/jiff/ext', express.static(__dirname + '/../jiff/ext'));
  app.use('/bignumber.js', express.static(__dirname + '/../jiff/node_modules/bignumber.js'));
  app.use('/socket.io.js', express.static(__dirname + '/../jiff/node_modules/socket.io-client/dist/socket.io.js'));

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
};
