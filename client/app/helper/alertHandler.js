define(['alertify', 'alertify_defaults'], function (alertify) {

  var error = function (msg) {
    alertify.alert('<img src="/images/cancel.png" alt="Error">Error!', msg);
  }

  var success = function (msg) {
    alertify.alert('<img src="/images/accept.png" alt="Success">Success!', msg);
  }

  return {
    error: error,
    success: success
  }
});