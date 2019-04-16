define(['jquery', 'controllers/analystController', 'table_template', 'Ladda',  'bootstrap'], function ($, analystController, tableTemplate, Ladda) {

  function trackView() {
    let SELF_SELECT = false;
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

        // if self-selection, add participant agnostic link div
        if (Object.keys(tableTemplate).includes("cohort_selection") && tableTemplate["cohort_selection"]) {
          SELF_SELECT = true;
          // $('#session-content)').append(createLinkGeneration('null'))
          $('#session-content').append($('#cohort-area').addClass('col-sm-7 col-md-offset-1'));
        } else {
          $('#cohort-card').collapse();
        }

        // load existing cohorts (TODO: check database)
        if (Object.keys(tableTemplate).includes('cohorts') && tableTemplate['cohorts'].length > 0) {
          for (var c of tableTemplate['cohorts']) {
            createCohort(c.name);
          }
        }

        // Handle status
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

      })
      .catch(function () {
        la.stop();
      });
    });

    $('#cohort-generate').on('click', function (e) {
      e.preventDefault();

      var cohortId = $('#cohort-input').val();

      createCohort(cohortId);

      // // analystController.addCohorts(session, password, numCohorts)
      //   .then(function (res) {
      //     if (res != null) {
      //       const totalCohorts = res.cohorts;

      //       for (var i = totalCohorts - numCohorts; i < totalCohorts; i++) {
      //         displayCohortElements(i);
      //         enableCohortSubmit(i);
      //       }
      //     }
      //   });
    });

    function createCohort(cohortId) {
      var $cohortDiv = createCohortContainer(cohortId);

      if (!SELF_SELECT) {
        $cohortDiv.append(createLinkGeneration(cohortId));
      }
      $cohortDiv.append(displayCohortHistory(cohortId));
    }

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
            .append('<td>' + new Date(data[i]).toLocaleString() + '</td>')
        );
      }

      var counter = $('#table-' + (cohort - 1) + ' thead i');
      counter.html(parseInt(counter.html()) + resubmissionCount);
    }

    function enableCohortSubmit(cohortId) {
      $('#participants-submit-' + cohortId).on('click', function (e) {
        e.preventDefault();

        var la = Ladda.create(document.getElementById('participants-submit-' + cohortId));
        la.start();

        var count = $('#participants-count-' + cohortId).val();

        analystController.generateNewParticipationCodes(session, password, count, cohortId)
          .then(function (res) {
            // TODO: DISPLAY IN DIV AFTER!!!

            // var cohort = Object.keys(res)[0];
            // var cohortId = parseInt(cohort) - 1;

            // var $newParticipants = $('#participants-new-' + cohortId);
            // if ($newParticipants.html() !== '') {
            //   $newParticipants.append('\n');
            // }

            // $newParticipants.append(res[cohort].join('\n')).removeClass('hidden');
            // $('#participants-new-hr-' + cohortId).removeClass('hidden');
            // $('#participants-new-h2-' + cohortId).show();

            // la.stop();
          });
      });
    }

    function displayCohortHistory(cohortId) {

      var $thead = $('<thead>')
        .append($('<tr>')
          .append('<th colspan="2">Total number of submissions: <i>0</i></th>')
        ).append($('<tr>')
          .append('<th>ID</th>')
          .append('<th>Timestamp</th>')
        );

      var $historyTable = $('<table id="table-' + cohortId + '" class="table table-striped"></table>')
      .append($thead)
      .append('<tbody id="participants-history-' + cohortId + '"></tbody>');

      var $historySection = $('<div></div>', {class: 'col-md-7 col-md-offset-1'});
      
      if (SELF_SELECT) {
        $historySection.addClass('card');
      }

      $historySection
        .append('<h2 class="text-center">' + cohortId + ' Submission History</h2>')
        .append('<hr/>')
        .append($historyTable);


      return $historySection
    }

    function createLinkGeneration(cohortId) {
      var $form = $('<form>');
      var $participants = $('<div>', {class: 'form-group'})
        .append('<label class="control-label" for="participants-count">New participants</label>')
        .append('<input type="number" id="participants-count-' + cohortId + '" class="form-control" placeholder="0" pattern="^[1-9]\d*{1,5}$" autocomplete="off" required/>')
        .append('<span id="new-participants-success" class="success-icon glyphicon glyphicon-ok form-control-feedback hidden" aria-hidden="true"></span>')
        .append('<span id="new-participants-fail" class="fail-icon glyphicon glyphicon-remove form-control-feedback hidden" aria-hidden="true"></span>')
        .append('<span id="new-participants-fail-help" class="fail-help help-block hidden">Please input a digit smaller than 100.000</span>')
        .append('<span id="new-participants-fail-custom-help" class="fail-custom help-block hidden"></span>');

      var $submitBtn = $('<div>', {class: 'form-group'})
        .append('<button type="submit" id="participants-submit-' + cohortId + '"  class="btn btn-primary ladda-button btn-block">Submit</button>');

      $form.append($participants);
      $form.append($submitBtn);

      var $cohortSection = $('<section>', {id: 'cohort-' + cohortId, class: 'card col-md-4'})
      .append('<h2 class="text-center">Add Participants</h2>')
      .append('<p class="text-center">Generate more URLs for new participants.</p>')
      .append($form)
      .append('<hr id="participants-new-hr-' + cohortId + '" class="hidden"/>')
      .append('<h2 id="participants-new-h2-' + cohortId + '" class="text-center" style="display:none;">New participants</h2>')
      .append('<pre id="participants-new-' + cohortId + '" class="hidden"></pre>')
      .append('<hr/>')
      .append('<h2 class="text-center">Existing participants</h2>')
      .append('<p class-"text-center">View the list of existing participation URLS.</p>')
      .append('<pre id="participants-existing-' + cohortId + '">No existing participants found</pre>');

      return $cohortSection;
    }

    function createCohortContainer(cohortName) {

      var $cohortDiv = $('<section>', {class: 'row', id: cohortName});
      if (!SELF_SELECT) {
        $cohortDiv.addClass('card')
          .append('<h2 class="text-center">' + cohortName + '</h2>')
          .append('<p class="text-center">Add new participants and manage existing participation on the left. View cohort submission history on the right</p>')
          .append('<hr/>');
        // var $cohortDiv = $('<section>', {class: 'row card', id: cohortName})
      }

    
      $('#cohort-area').append($cohortDiv);

      return $cohortDiv
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
