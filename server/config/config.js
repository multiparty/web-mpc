let deployment = process.env.WEBMPC_DEPLOYMENT;
if (deployment === null || deployment === undefined) {
  deployment = 'bwwc';
}

function setDeployment(deploymentName) {
  deployment = deploymentName;
  module.exports.config = require('./' + deployment + '.json');
}
module.exports = {
  setDeployment: setDeployment,
  config: require('./' + deployment + '.json')
}