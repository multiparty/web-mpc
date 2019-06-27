define(['jquery', 'controllers/analystController', 'Ladda', 'bootstrap'], function ($, analystController, Ladda) {

  function sessionView() {

    $(document).ready(function () {
      $('#session-creation').collapse('show');
    
      $('#verify').on('click', function(e) {
        if ($('#verify').is(":checked")) {
          $('#submit').prop('disabled', false);
        } else {
          $('#submit').prop('disabled', true);          
        }
      });
    });

    $(function () {
      $('#generate').on('click', function (e) {
        e.preventDefault();

        var la = Ladda.create(document.getElementById('generate'));
        la.start();

        var result = analystController.generateSession('infoDiv', 'sessionID', 'passwordID', 'privkeyID', 'link-id', 'session-title', 'session-description');
        if (result == null) {
          la.stop();
        } else {
          result.then(function () {
            la.stop();
            $('#session-creation').collapse('hide');
            $('#session-details').collapse('show');
          });
        }
      });
    });
  }

  return sessionView;
});
