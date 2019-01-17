let deployment = process.env.WEBMPC_DEPLOYMENT;
if (deployment === null || deployment === undefined) {
  deployment = 'pacesetters';
}

module.exports = require('./' + deployment + '.json');
