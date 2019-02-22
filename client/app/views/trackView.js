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
        .then(function (res) {

          const totalCohorts = res.cohorts;
          for (var i = 0; i < totalCohorts; i++) {
            displayCohortElements(i);
            enableCohortSubmit(i);
          }

          // TODO: something is broken with changing statuses
          changeStatusButtons(res.status);
          return analystController.getExistingParticipants(session, password);
        })
        .then(function (existingParticipants) {
          for (var cohort in existingParticipants) {

            var urls = existingParticipants[cohort];
            var $existingParticipants = $('#participants-existing-'+ (parseInt(cohort)-1));

            if ((urls.length, typeof(urls) === 'object')) {
              $existingParticipants.html(urls.join('\n'))
            }
          }
          analystController.getSubmissionHistory(session, password)
            .then(function(res) {
              if (res === undefined) {
                return;
              }
              for (var cohort in res) {
                displaySubmissionHistory(cohort, res[cohort].history);
              }
            });

          // Remove login panel and show control panel
          $('#session-login').collapse();
          $('#session-panel').collapse();
          $('#cohort-card').collapse();

          la.stop();     
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

      analystController.setCohorts(session, password, numCohorts)
        .then(function(res) {
          const totalCohorts = res.cohorts;

          // TODO: NEED AN ERROR MESSAGE HERE that session has been started / stopped
    
          for (var i = totalCohorts-numCohorts; i < totalCohorts; i++) {
            displayCohortElements(i);
            enableCohortSubmit(i);            
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

    function displaySubmissionHistory(cohort, data) {

      var submissionHTML = '';
      for (var i = 0; i < data.length; i++) {
          submissionHTML += '<tr><td>' + (i+1) + '</td><td>' + new Date(data[i]).toLocaleString() + '</td></tr>';
      }
        document.getElementById('table-' + (parseInt(cohort)-1)).innerHTML += submissionHTML;
    }

    function enableCohortSubmit(i) {
      $('#participants-submit-' + i).on('click', function (e) {
        e.preventDefault();

        var la = Ladda.create(document.getElementById('participants-submit-' + i));
        la.start();

        var count = $('#participants-count-' + i).val();
  
        analystController.generateUrls(session, password, count, i+1)
          .then(function (res) {

            var cohortId = parseInt(res.cohort)-1;

            var $newParticipants = $('#participants-new-' + cohortId);
            if ($newParticipants.html() !== '') {
              $newParticipants.append('\n');
            }

            $newParticipants.append(res.result.join('\n')).removeClass('hidden');

            la.stop();
          });
      });
    }

    function displayCohortElements(i) {

      var $form = $('<form>');
      var $participants = $('<div>', {class: 'form-group'})
                            .append('<label class="control-label" for="participants-count">New participants</label>')
                            .append('<input type="number" id="participants-count-'+ i + '" class="form-control" placeholder="0" pattern="^[1-9]\d*{1,5}$" autocomplete="off" required/>')
                            .append('<span id="new-participants-success" class="success-icon glyphicon glyphicon-ok form-control-feedback hidden" aria-hidden="true"></span>')
                            .append('<span id="new-participants-fail" class="fail-icon glyphicon glyphicon-remove form-control-feedback hidden" aria-hidden="true"></span>')
                            .append('<span id="new-participants-fail-help" class="fail-help help-block hidden">Please input a digit smaller than 100.000</span>')
                            .append('<span id="new-participants-fail-custom-help" class="fail-custom help-block hidden"></span>');
                      

      var $submitBtn = $('<div>', {class: 'form-group'})
                        .append('<button type="submit" id="participants-submit-' + i + '"  class="btn btn-primary ladda-button btn-block">Submit</button>')

      $form.append($participants);
      $form.append($submitBtn);

      $cohortSection = $('<section>', {id: 'cohort-' + i, class: 'card col-md-4'})
                    .append('<h2 class="text-center">Add Participants</h2>')
                    .append('<p class="text-center">Generate more URLs for new participants.</p>')
                    .append($form)
                    .append('<hr/>')
                    .append('<pre id="participants-new-' + i + '" class="hidden"></pre>')
                    .append('<hr/>')
                    .append('<h2 class="text-center">Existing participants</h2>')
                    .append('<p class-"text-center">View the list of existing participation URLS.</p>')
                    .append('<pre id="participants-existing-' + i + '">No existing participants found</pre>')
                    .appendTo('#cohort-area')
      

      $thead = $('<thead>') 
                .append('<tr>')
                .append('<th>ID</th>')
                .append('<th>Timestamp</th')

            
      $historyTable = $('<table id="table-'+i+'" class="table-striped"></table>')
                        .append($thead)
                        .append('<tbody id="participants-history-' + i + '"></tbody>');


      $historySection = $('<section></section>', {class: 'card col-md-7 col-md-offset-1'})
                          .append('<h2 class="text-center">Manage cohort</h2>')
                          .append('<p class="text-center">Fill in your cohort details on the left, add new participants and manage existing participation.</p>')
                          .append('<hr/>')
                          .append($historyTable);


      $cohortDiv = $('<div>', {class: 'row'})
        .append('<h2>Cohort ' + (i+1) + '</h1>')
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
