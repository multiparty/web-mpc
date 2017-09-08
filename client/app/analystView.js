define(['jquery', 'analystController'], function ($, analystController) {

  function analystView() {


    $(function () {
      $('#generate').on('click', function (e) {
        e.preventDefault();

        console.log("CLICKED")

        var la = Ladda.create(document.getElementById('generate'));
        la.start();

        analystController.generateSession('infoDiv', 'sessionID', 'passwordID', 'pubkeyID', 'privkeyID', 'link-id', 'session-title', 'session-description')
          .then(function () {
            la.stop();
            $('#session-details').removeClass('hidden');
          });
      });
    });
  }



  return analystView;


});