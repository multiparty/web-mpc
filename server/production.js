'use strict';

const http = require('http');
const https = require('https');
const config = require('./config/config.js');

function approveDomains(opts, certs, cb) {
  let regex = new RegExp(config['approveDomainsPattern']);
  if (!regex.test(opts.domain)) {
    cb(new Error('bad domain \''+ opts.domain + '\', not a subdomain of pacesettersdata.org'));
    return;
  }

  if (certs) {
    opts.domains = certs.altnames;
  } else {
    opts = Object.assign(opts, config['approveDomainsOpts'])
  }
  cb(null, { options: opts, certs: certs });
}

module.exports = {
  create: function (app) {
    if (process.env.NODE_ENV !== 'production') { // Staging
      // Do not force https, use a regular http server
      return http.createServer(app);
    }

    // Production: use https
    const LEX = require('greenlock-express');
    const lex = LEX.create({
      server: 'https://acme-v01.api.letsencrypt.org/directory',
      challenges: {
        'http-01': require('le-challenge-fs').create({
          webrootPath: config['webRootPath']
        })
      },
      store: require('le-store-certbot').create({
        webrootPath: config['webRootPath']
      }),
      approveDomains: approveDomains,
      debug: false
    });

    // Redirect 80 to https
    http.createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
      console.log('Listening for ACME http-01 challenges on', this.address());
    });

    // Create an https server, but do not listen yet.
    return https.createServer(lex.httpsOptions, lex.middleware(app));
  },
  listen: function (http) {
    if (process.env.NODE_ENV !== 'production') { // Staging
      // Run on port 8080 without forced https for development
      return http.listen(8080, function () {
        console.log('Listening for ACME http-01 challenges on', this.address());
      });
    }

    // listen to https on 443
    return http.listen(443, function () {
      console.log('Listening for ACME tls-sni-01 challenges and serve app on', this.address());
    });
  }
};
