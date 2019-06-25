'use strict';

const http = require('http');

module.exports = {
  create: function (app) {
    return http.createServer(app);
  },
  listen: function (http) {
    return http.listen(8080, function () {
      console.log('Listening for ACME http-01 challenges on', this.address());
    });
  }
};
