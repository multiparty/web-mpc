const { fork } = require('child_process');

let child;

module.exports = {
  create: function (deployment) {
    child = fork('server', [deployment], {silent: true});
  },
  quit: function () {
    child.kill();
  }
};