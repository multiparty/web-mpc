define(['table_template'], function (table_template) {

  var analytics = {};
  var timers = {};

  function initialize() {
    table_template.usability.forEach(function (metric) {
      if (typeof (metric) === 'string') {
        analytics[metric] = 0;
      } else if (typeof (metric) === 'object') {
        var key = Object.keys(metric)[0];
        var fields = metric[key];
        analytics[key] = {};

        fields.forEach(function (f) {
          analytics[key][f] = 0;
        });
      }
    });

    Object.keys(analytics.time_spent).forEach(function (k) {
      if (k === 'page') {
        timers[k] = new Date();
      } else {
        timers[k] = null;
      }

      $('#' + k).on('mouseenter', function () {
        startTimer(k);
      });

      $('#' + k).on('mouseleave', function () {
        endTimer(k);
      });
    });

    window.addEventListener('blur', endTimer);
    window.addEventListener('beforeunload', endTimer);
  }

  function stopAllTimers() {
    for (var key in timers) {
      if (timers[key] != null) {
        endTimer(key);
      }
    }
  }

  function startTimer(key) {
    timers[key] = new Date();
  }

  function endTimer(key) {
    if (timers[key] == null) {
      return;
    }

    if (typeof (key) !== 'string') {
      key = 'page';
    }
    var endDate = new Date();
    var spentTime = endDate.getTime() - timers[key].getTime();
    analytics.time_spent[key] += spentTime;
  }

  function saveBrowser() {
    // check Edge
    var ua = navigator.userAgent, tem,
      M = ua.match(/(opera|chrome|safari|edge|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    var browser = M[0].toLowerCase();

    for (var key in analytics.browser) {
      if (browser.includes(key)) {
        analytics.browser[key] += 1;
        return;
      }
    }
    analytics.browser.other += 1;
  }

  function addValidationError(err) {
    if (analytics.validation_errors[err] === undefined) {
      return;
    }
    analytics.validation_errors[err] += 1;
  }

  function dataPrefilled() {
    analytics.data_prefilled = 1;
  }

  return {
    addValidationError: addValidationError,
    analytics: analytics,
    dataPrefilled: dataPrefilled,
    initialize: initialize,
    saveBrowser: saveBrowser,
    stopAllTimers: stopAllTimers
  }
});
