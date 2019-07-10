const BigNumber = require('bignumber.js');

module.exports = {
  sumRows: function (inputs) {
    const parsed = inputs.map(input => input.map(v => new BigNumber(v)));
    return parsed.reduce((arr1, arr2) => arr1.map((v, i) => v.plus(arr2[i])));
  },

  computeAverage: function (inputs) {
    const count = inputs.length;
    const sum = module.exports.sumRows(inputs);
    return sum.map(v => v.div(count).toFixed(2));
  },

  computeDeviation: function (inputs) {
    const count = inputs.length;

    var squareOfAverage = module.exports.sumRows(inputs);
    squareOfAverage = squareOfAverage.map(v => new BigNumber(v).div(count).pow(2));

    var averageOfSquare = inputs.map(input => input.map(v => new BigNumber(v).pow(2)));
    averageOfSquare = module.exports.sumRows(averageOfSquare).map(v => new BigNumber(v).div(count));

    var deviations = averageOfSquare.map((v, i) => v.minus(squareOfAverage[i]));
    return deviations.map(v => v.sqrt().toFixed(2));
  }
};
