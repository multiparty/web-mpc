define(['jquery', 'controllers/analystController', 'Ladda', 'bootstrap'], function ($, analystController, Ladda) {

  function trackView() {

    var session, password;
    var num_cohorts = 0;

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
 
          // Remove login panel and show control panel
          $('#session-login').collapse();
          $('#session-panel').collapse();
          $('#cohort-card').collapse();

          // generateParticipants(num_cohorts);

          la.stop();     
        })
        .catch(function () {
          la.stop();
        });
    });

    $('#cohort-generate').on('click', function (e) {
      e.preventDefault();

      analystController.checkStatus(session, password)
        .then(function(res) {

          // TODO: NEED AN ERROR MESSAGE HERE that session has been started / stopped
          if (res === analystController.START || res === analystController.STOP) {
            return;
          }

          var n = parseInt($('#cohort-number').val());
          if (n <= 0) {
            return;
          }
    
          for (var i = num_cohorts; i < num_cohorts+n; i++) {
            addCohort(i);
          }
    
          num_cohorts = num_cohorts + n;    

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

    function addCohort(i) {


      var $form = $('<form>');
      var $participants = $('<div>', {class: 'form-group'})
                            .append('<label class="control-label" for="participants-count">New participants</label>')
                            .append('<input type="number" id="participants-count-'+ i + ' class="form-control" placeholder="0" pattern="^[1-9]\d*{1,5}$" autocomplete="off" required/>')
                            .append('<span id="new-participants-success" class="success-icon glyphicon glyphicon-ok form-control-feedback hidden" aria-hidden="true"></span>')
                            .append('<span id="new-participants-fail" class="fail-icon glyphicon glyphicon-remove form-control-feedback hidden" aria-hidden="true"></span>')
                            .append('<span id="new-participants-fail-help" class="fail-help help-block hidden">Please input a digit smaller than 100.000</span>')
                            .append('<span id="new-participants-fail-custom-help" class="fail-custom help-block hidden"></span>');
                      

      // var $submitBtn = $('div', {class: 'form-group'});
                        // .append('<button type="submit" class="btn btn-primary ladda-button btn-block">Submit</button>"')

    
      $form.append($participants);
      $form.append('<button type="submit" id="participants-submit-' + i + '" class="btn btn-primary ladda-button btn-block">Submit</button>');


      $cohortSection = $('<section>', {id: 'cohort-' + i, class: 'card col-md-4'})
                    .append('<h2 class="text-center">Add Participants</h2>')
                    .append('<p class="text-center">Generate more URLs for new participants.</p>')
                    .append($form)
                    .append('<pre class="hidden></pre>')
                    .append('<hr/>')
                    .append('<h2 class="text-center">Existing participants</h2>')
                    .append('<p class-"text-center">View the list of existing participation URLS.</p>')
                    .append('<pre id="participants-existing-' + i + '">No existing participants found</pre>')
                    .appendTo('#cohort-area')
      

      $thead = $('thead') 
      .append('<tr>')
      .append('<th>ID</th>')
      .append('<th>Timestamp</th')

            
      $historyTable = $('table').append($thead)
      .append('<tbody id="participants-history-' + i + '"></tbody>');


      $historySection = $('<section>', {class: 'card col-md-7 col-md-offset-1'})
                          .append('<h2 class="text-center">Manage cohort</h2>')
                          .append('<p class="text-center">Fill in your cohort details on the left, add new participants and manage existing participation.</p>')
                          .append('<hr/>')
                          .append($historyTable);


                         // <hr/>
                          // <table id="table" class="table table-striped hidden">
                          //   <thead>
                          //   <tr>
                          //     <th>ID</th>
                          //     <th>Timestamp</th>
                          //   </tr>
                          //   </thead>
                          //   <tbody id="participants">
                          //   </tbody>
                          // </table>

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

    function generateParticipants(num_participants) {

      for (var i = 0; i < num_participants; i++) {
             // Generate new participation links
        $('#participants-submit-' + i).on('click', function (e) {
          e.preventDefault();

          var la = Ladda.create(document.getElementById('participants-submit-' + i));
          la.start();

          analystController.generateUrls(session, password, $('#participants-count-'+i).val())
            .then(function (urls) {
              var $newParticipants = $('#participants-new-'+i);
              if ($newParticipants.html() !== '') {
                $newParticipants.append('\n');
              }
              $newParticipants.append(urls.join('\n')).removeClass('hidden');

              la.stop();
            });
        });
      }
    }


  }

  return trackView;
});
