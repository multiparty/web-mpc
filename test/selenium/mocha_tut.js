var assert = require('assert'),
test = require('selenium-webdriver/testing'),
webdriver = require('selenium-webdriver');
 
test.describe('Google Search', function() {
  test.it('should work', function() {
    var driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.chrome()).
    build();
driver.get('http://www.google.com');
    var searchBox = driver.findElement(webdriver.By.name('q'));
    searchBox.sendKeys('simple programmer');
    searchBox.getAttribute('value').then(function(value) {
      assert.equal(value, 'simple programmer');
    });
    driver.quit();
  });
});


// var webdriver = require('selenium-webdriver');
// var chrome = require('selenium-webdriver/chrome');
// var firefox = require('selenium-webdriver/firefox');
// { describe , before , after , it } require('selenium-webdriver/testing');

// let path = require('chromedriver').path;


// var driver = new webdriver.Builder()
//     .forBrowser('chrome')
//     // .setFirefoxOptions( /* … */)
//     .setChromeOptions( /* … */)
//     .build();


// // var profile = new firefox.Profile( /* … path to firefox local profile … */);


// var driver = new webdriver.Builder()
//     .withCapabilities( { 'browserName' : 'chrome' } )
//     .build();

// describe("Inner Suite 1", function(){
  
//   before(function(){
      
//   //     // do something before test suite execution
//   //     // no matter if there are failed cases
//     driver.get('http://localhost:8080/create');
//   });

//   after(function(){
//     driver.quit();
//   });
  
//   // beforeEach(function(){
      
//   //     // do something before test case execution
//   //     // no matter if there are failed cases
  
//   // });

//   // afterEach(function(){

//   //     // do something after test case execution is finished
//   //     // no matter if there are failed cases

//   // });

//   it("Test-1", function(){
//     // driver.get('http://localhost:8080/create');
//   });
// });