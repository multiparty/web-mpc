define(['jquery', 'controllers/analystController', 'table_template', 'Ladda', 'filesaver', 'alertHandler', 'bootstrap'], function ($, analystController, tableTemplate, Ladda, filesaver, alertHandler) {

  function trackView() {
    var SELF_SELECT = false;
    var session, password;

    var sessionParam = analystController.getParameterByName('session');
    if (sessionParam) {
      $('#session').val(sessionParam);
    }

    // Login
    $('#login').on('click', function (e) {
      e.preventDefault();
      session = $('#session').val();
      password = $('#password').val();

      if (!session || !password) {
        alertHandler.error('Enter a valid Session Key and Password');
        return;
      }

      var la = Ladda.create(document.getElementById('login'));
      la.start();

      var urlsPromise = analystController.getExistingParticipants(session, password);
      var statusPromise = analystController.checkStatus(session, password);
      Promise.all([urlsPromise, statusPromise]).then(function (results) {
        // Only logs in if both requests succeed
        var existingParticipants = results[0];
        var status = results[1];
        console.log('trackView, cohorts ', status.cohorts);

        // if self-selection, add participant agnostic link div
        if (Object.keys(tableTemplate).includes('cohort_selection') && tableTemplate['cohort_selection']) {
          SELF_SELECT = true;

          var unassignedCohort = '0';

          $('#session-content-left').append(createLinkGeneration(unassignedCohort));

          $('#cohort-0').removeClass('col-md-4');
          $('#cohort-0').addClass('card');

          enableCohortSubmit(unassignedCohort);

          var $cohortArea = $('#cohort-area').addClass('col-sm-7 card col-md-offset-1');
          var $historyTitle = document.createElement('h2');
          $historyTitle.setAttribute('class', 'text-center');
          $historyTitle.innerText = 'Submission History';
          $cohortArea.append($historyTitle);
          $('#session-content').append($cohortArea);

          createAndEnableDownloadBtn(unassignedCohort);

        } else {
          $('#cohort-card').collapse();
        }

        if (status.cohorts > 0) {
        // if (Object.keys(tableTemplate).includes('cohorts') && tableTemplate['cohorts'].length > 0) {
          analystController.getExistingCohorts(session, password).then(function (cohorts) {
            // console.log('trackView, cohorts ', cohorts);
            for (var c of cohorts) {
              createCohort(c.name, c.id);
              enableCohortSubmit(c.id);
            }

            handleExistingParticipants(existingParticipants);
            pollHistory(session, password, 0, cohorts);
          });
        }

        // Handle status
        changeStatusButtons(status.status);

        // Remove login panel and show control panel
        $('#session-login').collapse();
        $('#session-panel').collapse();
      }).catch(function (error) {
        la.stop();
        alertHandler.error(error.message);
      });
    });

    $('#cohort-enumerate').on('click', function (e) {
      e.preventDefault();
      let numCohorts = $('#cohort-number').val();
      if (numCohorts <= 0) {
        alertHandler.error('Invalid number of cohorts');
        return;
      }

      createNewCohortNamingSections(numCohorts);
    });

    function createNewCohortNamingSections(num) {
      $('#cohort-naming').empty();
      let $nameForm = $('<div>', {class: 'form-group'});
      for (let i = 0; i < num; i++) {
        // create and append section for naming 1 cohort
        $nameForm.append('<hr/>')
          .append('<h4>New Cohort ' + (i+1) + ' </h4>')
          .append('<label class="control-label" for="cohort-name-' + i + '">Enter Cohort Name (If not provided, number will be used)</label>')
          .append('<input type="text" id="cohort-name-' + i + '" class="form-control" pattern="^[a-zA-Z0-9]{1,26}$" placeholder="Cohort name" autocomplete="off"/>');
      }
      $('#cohort-naming').append($nameForm)
        .append('<div class="form-group">\n' +
        '        <button type="submit" id="cohort-generate" class="btn btn-block btn-primary">Generate</button>\n' +
        '        </div>');

      // click handler done this way because 'cohort-generate' is now a dynamically added button
      $(document).on('click', 'button[id=cohort-generate]', function (e) {
        e.preventDefault();

        let numCohorts = $('#cohort-number').val();
        if (numCohorts <= 0) {
          alertHandler.error('Invalid number of cohorts');
          return;
        }

        // create a array of new cohorts' names (or fill with null)
        const cohorts = [];
        for (let i = 0; i < numCohorts; i++) {
          let nameId = '#cohort-name-'+i;
          let cohortName = $(nameId).val();
          if (cohortName === '') {
            cohorts.push(null);
          } else {
            cohorts.push(cohortName);
          }
        }

        analystController.addCohorts(session, password, cohorts).then(function (res) {
          if (res != null) {
            for (let i = res.oldCohortId; i < res.cohortId; i++) {
              let cohortId = res.cohortMapping[i].id;
              let cohortName = res.cohortMapping[i].name;
              createCohort(cohortName, cohortId);
              enableCohortSubmit(cohortId);
            }

            // clear the add cohorts form
            $('#cohort-naming').empty();
            $('#cohort-number').val('');
          } else {
            alertHandler.error('Something went wrong when trying to add cohorts');
          }
        });
      });
    }

    function createAndEnableDownloadBtn(cohort) {
      var btn = $('<div class="form-group"><button type="submit" id="participants-download-'+ cohort +'" class="btn btn-primary btn-block">Download Participant Links</button></div>');
      $('#cohort-' + cohort).append(btn);
      $('#participants-download-' + cohort).on('click', function (e) {
        var allLinks = [];
        var newLinks = $('#participants-new-' + cohort).text().split('\n');

        if (newLinks.length > 1 || (newLinks.length === 1 && newLinks[0].includes('session'))) {
          allLinks = allLinks.concat(newLinks);
        }

        var existingLinks = $('#participants-existing-' + cohort).text().split('\n');
        if (existingLinks.length > 1 || (existingLinks.length === 1 && existingLinks[0].includes('session'))) {
          allLinks = allLinks.concat(existingLinks);
        }

        if (allLinks.length > 0) {
          filesaver.saveAs(new Blob([allLinks.join('\n')], {type: 'text/plain;charset=utf-8'}), 'Participant_Links_' + allLinks.length +  '.csv');
        } else {
          alertHandler.error('No participant links to download. Please enter new participants.');
        }
      });
    }

    // Handle existing participants
    function handleExistingParticipants(existingParticipants) {
      // Handle cohort-agnostic links
      if (existingParticipants['undefined'] && $('#participants-existing-null')) {
        var urls = existingParticipants['undefined'];
        var $existingParticipants = $('#participants-existing-null');
        $existingParticipants.html(urls.join('\n'));
      }

      for (var cohortId in existingParticipants) {
        if (!existingParticipants.hasOwnProperty(cohortId)) {
          continue;
        }

        urls = existingParticipants[cohortId];
        $existingParticipants = $('#participants-existing-' + cohortId);
        $existingParticipants.html(urls.join('\n'));
      }
    }

    function createCohort(cohortName, cohortId) {
      var $cohortDiv = createCohortContainer(cohortName, cohortId);
      $('#cohort-area').append($cohortDiv);

      if (!SELF_SELECT) {
        $cohortDiv.append(createLinkGeneration(cohortId));
      }
      $cohortDiv.append(displayCohortHistory(cohortName, cohortId));
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

    function pollHistory(session, password, timestamp, cohortMapping) {
      var previous = Date.now();
      analystController.getSubmissionHistory(session, password, timestamp)
        .then(function (res) {
          if (res != null) {
            for (var cohort in res) {
              if (res.hasOwnProperty(cohort)) {
                displaySubmissionHistory(cohort, res[cohort].history, res[cohort].count);
              }
            }
          }

          // Poll every 10 seconds
          setTimeout(function () {
            pollHistory(session, password, previous, cohortMapping)
          }, 10000);
        });
    }

    function displaySubmissionHistory(cohort, data, resubmissionCount) {
      var count = $('#table-' + cohort + ' tbody tr').length;
      for (var i = 0; i < data.length; i++) {
        count++;

        $('#table-' + cohort + ' tbody').append(
          $('<tr>')
            .append('<td>' + count + '</td>')
            .append('<td>' + data[i][1] + '</td>')
            .append('<td>' + new Date(data[i][0]).toLocaleString() + '</td>')
        );
      }

      var counter = $('#table-' + cohort + ' thead i');
      counter.html(parseInt(counter.html()) + resubmissionCount);
    }

    function enableCohortSubmit(cohortId) {
      $('#participants-submit-' + cohortId).on('click', function (e) {
        e.preventDefault();

        var la = Ladda.create(document.getElementById('participants-submit-' + cohortId));
        la.start();

        var count = $('#participants-count-' + cohortId).val();

        analystController.generateNewParticipationCodes(session, password, count, cohortId.toString())
          .then(function (res) {

            var $newParticipants = $('#participants-new-' + cohortId);
            if ($newParticipants.html() !== '') {
              $newParticipants.append('\n');
            }

            $newParticipants.append(res[cohortId].join('\n')).removeClass('hidden');
            $('#participants-new-hr-' + cohortId).removeClass('hidden');
            $('#participants-new-h2-' + cohortId).show();
            la.stop();
          });
      });
    }

    function displayCohortHistory(cohortName, cohortId) {

      // Create new elements
      var $historySection = document.createElement('div');

      var $historyTable = document.createElement('table');
      $historyTable.setAttribute('id', 'table-' + cohortId);
      $historyTable.setAttribute('class', 'table table-striped');

      var $historyNum = document.createElement('h4');
      var $thead = document.createElement('thead');
      var $tbody = document.createElement('tbody');
      var $tr = document.createElement('tr');
      var $idCell = document.createElement('th');
      var $participantIdCell = document.createElement('th');
      var $timeCell = document.createElement('th');
      var $header = document.createElement('div');
      var $title = document.createElement('h3');
      $header.setAttribute('class', 'text-center');

      if (SELF_SELECT) {
        $historyTable.style.marginBottom = '75px';
        $title.setAttribute('class', 'historySubTitle');
        $title.innerText = cohortName;
        $header.appendChild($title);
      } else {
        $title.innerText = 'Submission History';
        $header.appendChild($title);
        $historySection.setAttribute('class', 'col-md-7 col-md-offset-1');
      }

      // Attach elements
      $historySection.appendChild($header);

      $historySection.appendChild($historyTable);
      $historySection.appendChild($historyNum);

      $historyTable.appendChild($thead);
      $historyTable.appendChild($tbody);

      $tr.appendChild($idCell);
      $tr.appendChild($participantIdCell);
      $tr.appendChild($timeCell);
      $thead.appendChild($tr);

      // Content
      // TODO: do we need this if the id already shows how many?
      // $historyNum.innerHTML = 'Total number of submissions: <i>0</i>';
      $idCell.innerText = 'Submission #';
      $timeCell.innerText = 'Timestamp';
      $participantIdCell.innerText = 'Participant ID';

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

      var $cohortSection = $('<section>', {id: 'cohort-' + cohortId, class: 'col-md-4'})
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

    function createCohortContainer(cohortName, cohortId) {

      var $cohortDiv = $('<section>', {class: 'row', id: cohortId});
      if (!SELF_SELECT) {
        $cohortDiv.addClass('card')
          .append('<h2 class="text-center">' + cohortName + '</h2>')
          // .append('<p class="text-center">Add new participants and manage existing participation on the left. View cohort submission history on the right</p>')
          .append('<hr/>');
      }

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
