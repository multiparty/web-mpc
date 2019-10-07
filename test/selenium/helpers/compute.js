const BigNumber = require('bignumber.js');

module.exports = {
  sumRows: function (inputs) {
    const parsed = inputs.map(input => input.map(v => new BigNumber(v)));
    return parsed.reduce((arr1, arr2) => arr1.map((v, i) => v.plus(arr2[i])));
  },

  computeAverage: function (inputs, forCohort, threshold) {
    const sum = module.exports.sumRows(inputs);

    const tableSize = sum.length / 4;
    const result = sum.map((v, i) => v.div(sum[i % tableSize])).map(v => v.toFixed(2));

    if (!forCohort) {
      return result;
    }

    // set value to '-' for things that are less than threshold
    return result.map((v, i) => {
      if (i < tableSize) {
        return v;
      }

      if (sum[i % tableSize].lt(threshold)) {
        return '-';
      }

      return v;
    });
  },

  computeDeviation: function (inputs) {
    const sums = module.exports.sumRows(inputs);
    const tableSize = sums.length / 4;

    var squareOfAverage = sums.map((v, i) => new BigNumber(v).div(sums[i % tableSize]));
    squareOfAverage = squareOfAverage.map(v => v.pow(2));

    var averageOfSquare = inputs.map(input => input.map(v => new BigNumber(v).pow(2)));
    averageOfSquare = module.exports.sumRows(averageOfSquare);
    averageOfSquare = averageOfSquare.map((v, i) => new BigNumber(v).div(sums[i % tableSize]));

    var deviations = averageOfSquare.map((v, i) => v.minus(squareOfAverage[i]));
    return deviations.map(v => v.sqrt().toFixed(2));
  }
};
