const BigNumber = require('bignumber.js');

module.exports = {
  conditionOrAlertError: async function (driver, condition) {
    var result = await driver.wait(async function (driver) {
      var conditionResult = await condition.fn(driver);
      if (conditionResult) {
        return { status: true, result: conditionResult };
      }

      try {
        var alertBox = await (driver.switchTo().alert());
        alertBox.accept();
        return { status: false, error: await alertBox.getText() };
      } catch (err) {
        // if there is no alert box; we will get an exception; ignore it!
      }
    });

    if (!result.status) {
      throw new Error(result.error);
    }

    return result.result;
  },
  getUserHome: function () {
    return process.env.HOME || process.env.USERPROFILE;
  },
  readTableDataAsArray: async function (driver) {
    return await driver.wait(async function (driver) {
      try {
        var formattedData = [];
        var tableCount = await driver.executeScript('return window.__tables.length;');
        for (var table = 0; table < tableCount; table++) {
          const data = await driver.executeScript('return window.__tables[' + table + '].getData()');
          formattedData = formattedData.concat(data.reduce((v1, v2) => v1.concat(v2)).map(v => new BigNumber(v).toFixed(2)));
        }
        return formattedData;
      } catch (err) {
        console.log(err);
        return false;
      }
    });
  },
  generateRandomData: function (rows, cols, maxElement='10000000000') {
    var values = [];
    for (var i = 0; i < rows; i++) {
      values[i] = [];
      for (var j = 0; j < cols; j++) {
        values[i][j] = BigNumber.random().times(maxElement).floor().toString();
      }
    }
    return values;
  }
};
