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
  }
};
