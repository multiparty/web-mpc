let deployment = process.env.WEBMPC_DEPLOYMENT;
if (deployment === null || deployment === undefined) {
  deployment = 'bwwc';
}

module.exports = require('./' + deployment + '.json');
