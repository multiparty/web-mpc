define(['jquery', 'controllers/analystController', 'Ladda'], function ($, analystController, Ladda) {

  function sessionView() {


    $(function () {
      $('#generate').on('click', function (e) {
        e.preventDefault();

        var la = Ladda.create(document.getElementById('generate'));
        la.start();

        var result = analystController.generateSession('infoDiv', 'sessionID', 'passwordID', 'pubkeyID', 'privkeyID', 'link-id', 'session-title', 'session-description');
        if (result == null) {
          la.stop();
        } else {
          result.then(function () {
            la.stop();
            $('#session-details').removeClass('hidden');
          });
        }
      });
    });
  }

  return sessionView;
});
