define(['table_template', 'mpc'], function (table_template, mpc) {

  let analytics = {};
  let startDate = new Date();

  function initialize() {
    for (var metric of table_template.usability) {
      if (typeof(metric) === 'string') {
        analytics[metric] = 0;
      } else if (typeof(metric) === 'object') {
        var key = Object.keys(metric)[0];
        var fields = metric[key];
        analytics[key] = {};

        for (var f of fields) {
          analytics[key][f] = 0;
        }
      } 
    }

    window.addEventListener('focus', startTimer);
    window.addEventListener('blur', endTimer);
    window.addEventListener('beforeunload', logTime);

  }

  function detectBrave() {
    // initial assertions
    if (!window.google_onload_fired &&
         navigator.userAgent &&
        !navigator.userAgent.includes('Chrome'))
      return false;
  
    // set up test
    var test = document.createElement('iframe');
    test.style.display = 'none';
    document.body.appendChild(test);
  
    // empty frames only have this attribute set in Brave Shield
    var is_brave = (test.contentWindow.google_onload_fired === true);
  
    // teardown test
    test.parentNode.removeChild(test);
  
    return is_brave;
  }

  function startTimer() {
    startDate = new Date();
  };

  function endTimer() {
    const endDate = new Date();
    const spentTime = endDate.getTime() - startDate.getTime();
    analytics.time_spent += spentTime;
  };

  function logTime() {
    const endDate = new Date();
    const spentTime = endDate.getTime() - startDate.getTime();
    analytics.time_spent += spentTime;
  };

  function saveBrowser() {
    // check Edge
    var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|edge|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
    var browser = M[0].toLowerCase();

    if (detectBrave) {
      analytics.browser.brave += 1;
      return;
    }

    for (let key in analytics.browser) {
      if (browser.includes(key)) {
        analytics.browser[key] += 1;
        return;
      }
    }
    analytics.browser.other += 1;
 }

  function addValidationError(err) {
    analytics.validation_errors[err] += 1;
  }

  function dataPrefilled() {
    analytics.data_prefilled += 1;
  }

  return {
    addValidationError: addValidationError,
    analytics: analytics,
    dataPrefilled: dataPrefilled,
    initialize: initialize,
    saveBrowser: saveBrowser
  };
});
