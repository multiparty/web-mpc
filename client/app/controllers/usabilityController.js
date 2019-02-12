define(['table_template'], function (table_template) {

  let analytics = {};

  let timers = {
    page: {start: new Date(), elapsed: null},
    session_area: {start: null, elapsed: null}
  }

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

    $('#session-area').on("mouseenter", function() {
      startTimer('session_area');
    });

    $('#session-area').on("mouseleave", function() {
      endTimer('session_area');
    })

    window.addEventListener('blur', endTimer);
    window.addEventListener('beforeunload', endTimer);

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

  function startTimer(key) {
    timers[key].start = new Date();
  };

  function endTimer(key) {
    if (typeof(key) !== 'string') {
      key = 'page';
    }
    const endDate = new Date();
    const spentTime = endDate.getTime() - timers[key].start.getTime();
    analytics.time_spent[key] += spentTime;
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
    addValidationError,
    analytics,
    dataPrefilled,
    initialize,
    saveBrowser
  };
});
