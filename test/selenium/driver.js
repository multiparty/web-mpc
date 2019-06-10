/* eslint-env node, mocha */
const webDriver = require('selenium-webdriver');
const seleniumChrome = require('selenium-webdriver/chrome');
const chromDriver = require('chromedriver');

var driver = null;

module.exports = {
  create: function () {
    var service = new seleniumChrome.ServiceBuilder(chromDriver.path).build();
    seleniumChrome.setDefaultService(service);

    driver = new webDriver.Builder()
      .forBrowser('chrome')
      .withCapabilities(webDriver.Capabilities.chrome())
      .setChromeOptions(new seleniumChrome.Options().setUserPreferences({
        'profile.default_content_setting_values.automatic_downloads': 1,  // allow multiple file download
        'download.prompt_for_download': false
      }))
      .build();
  },
  quit: function () {
    driver.quit();
  },
  getDriver: function () {
    return driver;
  }
};
