/**
 * Server static files.
 */

const express = require('express');

const config = require('./config/config.js');
const rendering = {
  index: require('./rendering/index.js')
};

module.exports = function (app) {
  // serve static files in designated folders
  app.get('/', function (req, res) {
    // /client/index.html
    rendering['index'].render(app, req, res);
  });

  app.get('/definitions', function (req, res) {
    res.render('definitions.html', config.client);
  });

  app.get('/create', function (req, res) {
    res.render('create.html', config.client);
  });

  app.get('/manage', function (req, res) {
    // /client/manage.html
    res.render('manage.html', config.client);
  });

  app.get('/unmask', function (req, res) {
    // /client/unmask.html
    res.render('unmask.html', config.client);
  });

  app.use(express.static(__dirname + '/../client'));
  app.use('/jiff', express.static(__dirname + '/../jiff/dist'));
  app.use('/jiff/ext', express.static(__dirname + '/../jiff/lib/ext'));
  app.use('/bignumber.js', express.static(__dirname + '/../jiff/node_modules/bignumber.js'));
};
