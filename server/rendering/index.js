// Server-side Rendering for the client age (/index.html)
const { config } = require('../config/config.js');
const tableTemplate = require('../../client/app/' + config.client.table_template + '.js');

exports.render = function (app, req, res) {
  var cohorts = null;

  if (tableTemplate['cohort_selection'] === true) {
    cohorts = (tableTemplate['cohorts'] || []).map((v, i) => ({name: v.name, id: i+1}));
  }

  var renderingParam = {
    client: config['client'],
    cohorts: cohorts
  };

  res.render('index.html', renderingParam);
};
