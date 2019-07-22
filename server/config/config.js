let deployment = process.env.WEBMPC_DEPLOYMENT;
if (deployment === null || deployment === undefined) {
  deployment = 'bwwcTraining';
}

module.exports = require('./' + deployment + '.json');
