const BigNumber = require('bignumber.js');

module.exports = {
  sumRows: function (inputs) {
    let parsed = inputs.map(input => input.map(v => new BigNumber(v)));
    return parsed.reduce((arr1, arr2) => arr1.map((v, i) => v.plus(arr2[i])));
  },

  // for Pacesetters - need the ratios of MBE to total values (need to also do the *1000 bit)
  computeRatios: function (inputs) {
    const newInputs = [...inputs];
    for (let i = 0; i < newInputs.length; i++) {
      let in_i = newInputs[i];
      const tableSize = in_i.length / 6;
      const ratios = [];
      for (let j = 0; j < in_i.length/2; j++) {
        let ratio = 0;
        if (in_i[j+(tableSize*3)] !== 0) {
          ratio = in_i[j]/in_i[j+(tableSize*3)];
          ratio = ratio * 1000;
          ratio = Math.trunc(ratio);
        }
        ratios.push(ratio);
      }
      newInputs[i] = in_i.concat(ratios);
    }
    return newInputs;
  },

  computeAverage: function (inputs) {
    const inputsWithRatios = module.exports.computeRatios(inputs);
    const sum = module.exports.sumRows(inputsWithRatios);
    const result = sum.map(v => v.div(inputs.length));
    return result.map(v => v.toFixed(2)); // dividedToIntegerBy is a hack to get rid of the extra decimals in ratio
  },

  computeDeviation: function (inputs) {
    // let parsed = inputs.map(input => input.map(v => new BigNumber(v)));
    let inputsWithRatios = module.exports.computeRatios(inputs);
    const sums = module.exports.sumRows(inputsWithRatios);
    const numberOfParties = inputs.length;

    var squareOfAverage = sums.map(v => new BigNumber(v).div(numberOfParties));
    squareOfAverage = squareOfAverage.map(v => v.pow(2));

    // console.log('sq avg ', squareOfAverage);

    var averageOfSquare = inputsWithRatios.map(p => p.map(v => new BigNumber(v).pow(2)));
    averageOfSquare = module.exports.sumRows(averageOfSquare);
    averageOfSquare = averageOfSquare.map(v => new BigNumber(v).div(numberOfParties));

    // console.log('avg sq ', averageOfSquare);

    var deviations = averageOfSquare.map((v, i) => v.minus(squareOfAverage[i]));
    // console.log('dev ', deviations);
    return deviations.map(v => v.sqrt().toFixed(2));
  }
};
