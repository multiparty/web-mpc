const BigNumber = require('bignumber.js');

module.exports = {
  sumRows: function (inputs) {
    const parsed = inputs.map(input => input.map(v => new BigNumber(v)));
    return parsed.reduce((arr1, arr2) => arr1.map((v, i) => v.plus(arr2[i])));
  },

  // takes inputs an array of 1D arrays, each array is one party's inputs
  // the inputs are the content of the 4 submitted tables, from first table to last, starting by first row
  // then second row, etc.
  // this will reduce the input of every array to 4 tables after one another, each table containing the same number
  // of rows, but only 2 columns, the first for female, and the second for male
  reduceByGender: function (inputs) {
    return inputs.map(input => {
      const output = [];

      // written very verbosely to avoid bugs
      const tableCount = 4;
      const tableSize = input.length / tableCount;
      const colCount = 16;
      const rowCount = tableSize / colCount;

      // loop over elements in the input one at a time in the same order
      for (let t = 0; t < tableCount; t++) {
        for (let r = 0; r < rowCount; r++) {
          let female = 0, male = 0;
          for (let c = 0; c < colCount; c++) {
            const i = t * tableSize + r * colCount + c;
            const num = new BigNumber(input[i]);
            if (c % 2 === 0) {
              female = num.plus(female);
            } else {
              male = num.plus(male);
            }
          }
          output.push(female, male);
        }
      }

      // done
      return output;
    });
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

  computeAverageAgainstTable: function (inputs) {
    const sum = module.exports.sumRows(inputs);
    const tableSize = sum.length / 4;

    const result = sum.map((v, i) => i < tableSize ? v : v.div(sum[i % tableSize]));
    return result.map(v => v.toFixed(2));
  },

  computeStandardAverage: function (inputs) {
    const inputsWithRatios = module.exports.computeRatios(inputs);
    const sum = module.exports.sumRows(inputsWithRatios);
    const result = sum.map(v => v.div(inputs.length));
    return result.map(v => v.toFixed(2)); // dividedToIntegerBy is a hack to get rid of the extra decimals in ratio
  },

  computeDeviation: function (inputs) {
    const sums = module.exports.sumRows(inputs);
    const numberOfParties = inputs.length;

    var squareOfAverage = sums.map(v => new BigNumber(v).div(numberOfParties));
    squareOfAverage = squareOfAverage.map(v => v.pow(2));

    var averageOfSquare = inputs.map(input => input.map(v => new BigNumber(v).pow(2)));
    averageOfSquare = module.exports.sumRows(averageOfSquare);
    averageOfSquare = averageOfSquare.map(v => new BigNumber(v).div(numberOfParties));

    var deviations = averageOfSquare.map((v, i) => v.minus(squareOfAverage[i]));
    return deviations.map(v => v.sqrt().toFixed(2));
  },

  computeDeviationWithRatios: function (inputs) {
    let inputsWithRatios = module.exports.computeRatios(inputs);
    const sums = module.exports.sumRows(inputsWithRatios);
    const numberOfParties = inputs.length;

    var squareOfAverage = sums.map(v => new BigNumber(v).div(numberOfParties));
    squareOfAverage = squareOfAverage.map(v => v.pow(2));

    var averageOfSquare = inputsWithRatios.map(p => p.map(v => new BigNumber(v).pow(2)));
    averageOfSquare = module.exports.sumRows(averageOfSquare);
    averageOfSquare = averageOfSquare.map(v => new BigNumber(v).div(numberOfParties));

    var deviations = averageOfSquare.map((v, i) => v.minus(squareOfAverage[i]));
    return deviations.map(v => v.sqrt().toFixed(2));
  }
};
