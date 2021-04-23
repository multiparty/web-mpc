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

      var statusPromise = analystController.checkStatus(session, password);
      var urlsPromise = analystController.getExistingParticipants(session, password);
      Promise.all([statusPromise, urlsPromise]).then(function (results) {
        // Only logs in if both requests succeed
        var status = results[0];
        var existingParticipants = results[1];

        if (status == null || existingParticipants == null) {
          la.stop();
          return;
        }

        // Handle status
        const totalCohorts = status.cohorts;
        for (var i = 0; i < totalCohorts; i++) {
          displayCohortElements(i);
          enableCohortSubmit(i);
        }
        changeStatusButtons(status.status);

        // Handle existing participants
        for (var cohort in existingParticipants) {
          if (!existingParticipants.hasOwnProperty(cohort)) {
            continue;
          }

          var urls = existingParticipants[cohort];
          var $existingParticipants = $('#participants-existing-' + (parseInt(cohort) - 1));
          $existingParticipants.html(urls.join('\n'))
        }

        pollHistory(session, password, 0);

        // Remove login panel and show control panel
        $('#session-login').collapse();
        $('#session-panel').collapse();
        $('#cohort-card').collapse();
      })
      .catch(function () {
        la.stop();
      });
    });

    $('#cohort-generate').on('click', function (e) {
      e.preventDefault();

      var numCohorts = parseInt($('#cohort-number').val());
      if (numCohorts <= 0) {
        return;
      }

      analystController.addCohorts(session, password, numCohorts)
        .then(function (res) {
          if (res != null) {
            const totalCohorts = res.cohorts;

            for (var i = totalCohorts - numCohorts; i < totalCohorts; i++) {
              displayCohortElements(i);
              enableCohortSubmit(i);
            }
          }
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

    function pollHistory(session, password, timestamp) {
      var previous = Date.now();
      analystController.getSubmissionHistory(session, password, timestamp)
        .then(function (res) {
          if (res != null) {
            for (var cohort in res) {
              if (res.hasOwnProperty(cohort)) {
                displaySubmissionHistory(parseInt(cohort), res[cohort].history, res[cohort].count);
              }
            }
          }

          // Poll every 10 seconds
          setTimeout(function () {
            pollHistory(session, password, previous)
          }, 10000);
        });
    }

    function displaySubmissionHistory(cohort, data, resubmissionCount) {
      var count = $('#table-' + (cohort - 1) + ' tbody tr').length;
      for (var i = 0; i < data.length; i++) {
        count++;

        $('#table-' + (cohort - 1) + ' tbody').append(
          $('<tr>')
            .append('<td>' + count + '</td>')
            .append('<td>' + data[i][1] + '</td>')
            .append('<td>' + new Date(data[i][0]).toLocaleString() + '</td>')
        );
      }

      var counter = $('#table-' + (cohort - 1) + ' thead i');
      counter.html(parseInt(counter.html()) + resubmissionCount);
    }

    function enableCohortSubmit(i) {
      $('#participants-submit-' + i).on('click', function (e) {
        e.preventDefault();

        var la = Ladda.create(document.getElementById('participants-submit-' + i));
        la.start();

        var count = $('#participants-count-' + i).val();

        analystController.generateNewParticipationCodes(session, password, count, i + 1)
          .then(function (res) {
            var cohort = Object.keys(res)[0];
            var cohortId = parseInt(cohort) - 1;

            var $newParticipants = $('#participants-new-' + cohortId);
            if ($newParticipants.html() !== '') {
              $newParticipants.append('\n');
            }

            $newParticipants.append(res[cohort].join('\n')).removeClass('hidden');
            $('#participants-new-hr-' + cohortId).removeClass('hidden');
            $('#participants-new-h2-' + cohortId).show();

            la.stop();
          });
      });
    }

    function displayCohortElements(i) {
      var $form = $('<form>');
      var $participants = $('<div>', {class: 'form-group'})
        .append('<label class="control-label" for="participants-count">New participants</label>')
        .append('<input type="number" id="participants-count-' + i + '" class="form-control" placeholder="0" pattern="^[1-9]\d*{1,5}$" autocomplete="off" required/>')
        .append('<span id="new-participants-success" class="success-icon glyphicon glyphicon-ok form-control-feedback hidden" aria-hidden="true"></span>')
        .append('<span id="new-participants-fail" class="fail-icon glyphicon glyphicon-remove form-control-feedback hidden" aria-hidden="true"></span>')
        .append('<span id="new-participants-fail-help" class="fail-help help-block hidden">Please input a digit smaller than 100.000</span>')
        .append('<span id="new-participants-fail-custom-help" class="fail-custom help-block hidden"></span>');

      var $submitBtn = $('<div>', {class: 'form-group'})
        .append('<button type="submit" id="participants-submit-' + i + '"  class="btn btn-primary ladda-button btn-block">Submit</button>');

      $form.append($participants);
      $form.append($submitBtn);

      var $cohortSection = $('<section>', {id: 'cohort-' + i, class: 'card col-md-4'})
        .append('<h2 class="text-center">Add Participants</h2>')
        .append('<p class="text-center">Generate more URLs for new participants.</p>')
        .append($form)
        .append('<hr id="participants-new-hr-' + i + '" class="hidden"/>')
        .append('<h2 id="participants-new-h2-' + i + '" class="text-center" style="display:none;">New participants</h2>')
        .append('<pre id="participants-new-' + i + '" class="hidden"></pre>')
        .append('<hr/>')
        .append('<h2 class="text-center">Existing participants</h2>')
        .append('<p class-"text-center">View the list of existing participation URLS.</p>')
        .append('<pre id="participants-existing-' + i + '">No existing participants found</pre>')
        .appendTo('#cohort-area');

      var $thead = $('<thead>')
        .append($('<tr>')
          .append('<th colspan="2">Total number of submissions: <i>0</i></th>')
        ).append($('<tr>')
          .append('<th>Submission #</th>')
          .append('<th>Participant ID</th>')
          .append('<th>Timestamp</th>')
        );

      var $historyTable = $('<table id="table-' + i + '" class="table table-striped"></table>')
        .append($thead)
        .append('<tbody id="participants-history-' + i + '"></tbody>');

      var $historySection = $('<section></section>', {class: 'card col-md-7 col-md-offset-1'})
        .append('<h2 class="text-center">Manage cohort</h2>')
        .append('<p class="text-center">Fill in your cohort details on the left, add new participants and manage existing participation.</p>')
        .append('<hr/>')
        .append($historyTable);

      var $cohortDiv = $('<div>', {class: 'row'})
        .append('<h2>Cohort ' + (i + 1) + '</h1>')
        .append($cohortSection)
        .append($historySection);

      $('#cohort-area').append($cohortDiv);
    }

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
  }

  return trackView;
});
