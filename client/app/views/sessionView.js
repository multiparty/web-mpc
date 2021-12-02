define(['jquery', 'controllers/analystController', 'alertHandler', 'filesaver', 'Ladda', 'bootstrap'], function ($, analystController, alertHandler, filesaver, Ladda) {

  function sessionView() {

    $(document).ready(function () {
      $('#verify').on('click', function (e) {
        if ($('#verify').is(':checked')) {
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
        var title = document.getElementById('session-title').value;
        var description = document.getElementById('session-description').value;
        var result = analystController.generateSession(title, description);
        if (result == null) {
          la.stop();
        } else {
          result.then(function (res) {
            try {
              var sessionID = res.sessionID;
              var privateKey = res.privateKey;
              var password = res.password;

              // populate session info
              document.getElementById('privkeyID').innerHTML = privateKey;
              document.getElementById('sessionID').innerHTML = sessionID;
              document.getElementById('passwordID').innerHTML = password;
              document.getElementById('link-id').href = '/manage?session=' + sessionID;

              // download files
              var priBlob = new Blob([privateKey], {type: 'text/plain;charset=utf-8'});
              filesaver.saveAs(priBlob, 'Session_' + sessionID + '_private_key.pem');

              var sessionKeyName = (document.getElementById('sessionKeyID').innerHTML).slice(1,-1);  //Removing excess white space from handlebars rendering.
              var text = sessionKeyName + ':\n' + sessionID + '\nPassword:\n' + password;
              filesaver.saveAs(new Blob([text], {type: 'text/plain;charset=utf-8'}), 'Session_' + sessionID + '_password.txt');

              // stop loading wheel & reveal div
              la.stop();
              $('#session-creation').collapse('hide');
              $('#session-details').collapse('show');
            } catch (e) {
              la.stop();
              alertHandler.error('Error displaying session information. Please refresh the page and try again.');
            }
          });
        }
      });
    });
  }

  return sessionView;
});
