define(['jquery', 'controllers/analystController', 'Ladda', 'bootstrap'], function ($, analystController, Ladda) {

  function trackView() {

    var session, password;


    $('#session').val(analystController.getParameterByName('session'));

    // Login
    $('#login').on('click', function (e) {
      e.preventDefault();
      session = $('#session').val();
      password = $('#password').val();

      var la = Ladda.create(document.getElementById('login'));
      la.start();

      analystController.checkStatus(session, password)
        .then(function (status) {
          changeStatusButtons(status);
          return analystController.getExistingParticipants(session, password);
        })
        .then(function (urls) {
          la.stop();

          var $existingParticipants = $('#participants-existing');

          if ((urls.length, typeof(urls) === 'object')) {
            $existingParticipants.html(urls.join('\n'))
          }

          $('#table').removeClass('hidden');
          analystController.generateTable('table', session, password, 'statusID');

          // Remove login panel and show control panel
          $('#session-login').collapse();
          $('#session-panel').collapse();
        })
        .catch(function () {
          la.stop();
        });
    });


    // Manage session
    $('#session-start').on('click', function (e) {
      e.preventDefault();
      analystController.changeStatus(session, password, analystController.START)
        .then(function () {
          changeStatusButtons(analystController.START);
        });
    });

    $('#session-pause').on('click', function (e) {
      e.preventDefault();
      analystController.changeStatus(session, password, analystController.PAUSE)
        .then(function () {
          changeStatusButtons(analystController.PAUSE);
        });
    });

    $('#session-stop').on('click', function (e) {
      e.preventDefault();
    });

    $('#session-close-confirm').on('click', function (e) {
      e.preventDefault();
      analystController.changeStatus(session, password, analystController.STOP)
        .then(function () {
          changeStatusButtons(analystController.STOP);
        });
    });

    function changeStatusButtons(status) {
      var $start = $('#session-start'),
        $pause = $('#session-pause'),
        $stop = $('#session-stop'),
        $sessionStatus = $('#session-status'),
        $sessionUnmask = $('#session-unmask');

      switch (status) {
        case 'START':
          $start.addClass('hidden');
          $pause.removeClass('hidden');
          $stop.removeClass('hidden');
          $sessionStatus.html('STARTED');
          break;
        case 'PAUSE':
          $start.removeClass('hidden');
          $pause.addClass('hidden');
          $stop.removeClass('hidden');
          $sessionStatus.html('PAUSED');
          break;
        case 'STOP':
          $start.addClass('hidden');
          $pause.addClass('hidden');
          $stop.addClass('hidden');
          $sessionStatus.html('STOPPED');
          $sessionUnmask.removeClass('hidden');
          $sessionUnmask.find('a').attr('href', '/unmask?session=' + session);
          break;
      }
    }


    // Generate new participation links
    $('#participants-submit').on('click', function (e) {
      e.preventDefault();

      var la = Ladda.create(document.getElementById('participants-submit'));
      la.start();

      analystController.generateUrls(session, password, $('#participants-count').val())
        .then(function (urls) {
          var $newParticipants = $('#participants-new');
          if ($newParticipants.html() !== '') {
            $newParticipants.append('\n');
          }
          $newParticipants.append(urls.join('\n')).removeClass('hidden');

          la.stop();
        });
    });
  }

  return trackView;
});
