define(['jquery', 'controllers/clientController', 'controllers/tableController', 'helper/drop_sheet', 'spin', 'Ladda', 'ResizeSensor', 'alertify', 'table_template', 'bootstrap'],
  function ($, clientController, tableController, DropSheet, Spinner, Ladda, ResizeSensor, alertify, table_template) {

    function clientControllerView() {

      $(document).ready(function () {

        var $verify = $('#verify');
        var $session = $('#session');
        var $participationCode = $('#participation-code');

        $('#session, #participation-code').on('blur', function (e) {
          e.target.dataset['did_blur'] = true;
          clientController.validateSessionInput(e.target, true);
        });

        $('#session, #participation-code').on('input', function (e) {
          if (e.target.dataset['did_blur']) {
            clientController.validateSessionInput(e.target, false);
          }
          $verify.prop('checked', false);
        });

        //Copied from trusted/session_data
        var getParameterByName = function (name) {
          name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
          var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
            results = regex.exec(location.search);
          return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        };

        $participationCode.val(getParameterByName('participationCode'));

        $session.val(getParameterByName('session'));

        if (String($session.val()).trim() !== '') {
          $session.blur();
        }
        if (String($participationCode.val()).trim() !== '') {
          $participationCode.blur();
        }

        // Remove error from radio buttons once you click on them
        $('form input[type=radio]').on('change', function (e) {
          $(e.target.form).removeClass('has-error');
          $verify.prop('checked', false);
        });

        // Create the tabless
        var tables = tableController.makeTables();
        window.scrollTo(0, 0);
        var sums = [0, 0]; // Internal total of Non NaNs values.
        var NaNs = [0, 0]; // Counts how many NaNs exist for every cell participating in a total.

        // Custom afterChange hook that computes the totals
        var afterChange = function (changes, source) {
          if (changes === null) {
            return;
          }

          for (var i = 0; i < changes.length; i++) {
            var change = changes[i];
            var old = change[2];
            var val = change[3];

            var c = change[1];
            var index = c % 2; // Even columns are for females, odd are for males.

            if (old === undefined) {
              old = null;
            }
            if (val === undefined) {
              val = null;
            }

            // Keep track of how many NaNs there are.
            if (isNaN(old) && !isNaN(val)) {
              NaNs[index]--;
            }
            if (!isNaN(old) && isNaN(val)) {
              NaNs[index]++;
            }

            // If either values is a NaN, discard it when computing internal sum.
            old = (old === '' || old === null || isNaN(old)) ? 0 : old;
            val = (val === '' || val === null || isNaN(val)) ? 0 : val;
            sums[index] += val - old;
          }

          // Display a NaN in the totals Column if you need too.
          var totals = [sums[0], sums[1], sums[0] + sums[1]];
          if (NaNs[0] + NaNs[1] > 0) { // If there is at least one NaN, change every thing to Excel's NaN equivalent.
            totals = ['#VALUE!', '#VALUE!', '#VALUE!'];
          }

          // Note: took out declarations to fix eslint error
          changes = []; // [ [row, col, change], [row, col, change], ..]
          for (i = 0; i < totals.length; i++) {
            changes.push([0, i, totals[i]]);
          }
          tables[4].setDataAtCell(changes); // This changes the data without changing cellProperties (e.g. keeps readOnly)
        };
        // Alerts, page elements, etc. for drag-and-drop/choose file.
        // var workbook_js = null;

        var _target = document.getElementById('drop-area');
        var _choose = document.getElementById('choose-file-button');
        var spinner;
        var _workstart = function () {

          if ($('#tables-area').css('display') !== 'none') {
            $('#tables-area').hide();
            $('#expand-table-button').toggleClass('flip');
            resizeCard(tables, false);
          }
          spinner = new Spinner().spin(_target);
        };
        var _workend = function (status) {
          spinner.stop();
          if (status) {
            $('#tables-area').slideToggle(function () {
              $('#expand-table-button').toggleClass('flip');
              if ($('#tables-area').css('display') === 'none') {
                resizeCard(tables, false);
              } else {
                resizeCard(tables, true);
              }
            });
          }
        };

        var _badfile = function () {
          alertify.alert('<img src="/images/cancel.png" alt="Error">Error!', 'This file does not appear to be a valid Excel file.', function () {
          });

          spinner.stop();
        };
        var _pending = function () {
          alertify.alert('<img src="/images/cancel.png" alt="Error">Error!', 'Please wait until the current file is processed.', function () {
          });
        };
        var _large = function (len, cb) {
          alertify.confirm('<img src="/images/cancel.png" alt="Error">Error!', 'This file is ' + (len / (1024 * 1024)).toFixed(2) + ' MB and may take a few moments. Your browser may lock up during this process. Continue?', cb);
        };
        var _failed = function (e) {
          alertify.alert('<img src="/images/cancel.png" alt="Error">Error!', 'This format is not supported.', function () {
          });

          spinner.stop();
        };

        var $window, availableWidth, availableHeight;
        var calculateSize = function () {
          availableWidth = Math.max($('#drop-area').width(), 600);
          availableHeight = Math.max($window.height() - 250, 400);
        };

        $(document).ready(function () {
          $window = $(window);
          $window.on('resize', calculateSize);
        });


        var _onsheet = function (json, cols, sheetnames, select_sheet_cb) {
          calculateSize();
          if (!json) {
            json = [];
          }
          /* add header row for table */
          json.unshift(function (head) {
            var o = {};

            for (i = 0; i !== head.length; ++i) {
              o[head[i]] = head[i];
            }

            return o;
          }(cols));
          calculateSize();
        };

        DropSheet({
          drop: _target,
          choose: _choose,
          tables: tables,
          tables_def: table_template,
          on: {workstart: _workstart, workend: _workend, sheet: _onsheet},
          errors: {badfile: _badfile, pending: _pending, failed: _failed, large: _large}
        });

        // Table accordion.
        $('#tables-area').hide();

        $('#expand-table-button').click(function (e) {
          $('#tables-area').slideToggle(function () {
            if ($('#tables-area').css('display') === 'none') {
              resizeCard(tables, false);
            } else {
              resizeCard(tables, true);
            }
          });
          $(e.target).toggleClass('flip');
        });

        function resizeCard(tables, attach) {
          if (attach) {
            new ResizeSensor($('#number-employees-hot').find('.wtHider').first()[0], function () {
              // clientController.updateWidth(tables);
            });
            new ResizeSensor($('#compensation-hot').find('.wtHider').first()[0], function () {
              // clientController.updateWidth(tables);
            });
            new ResizeSensor($('#performance-pay-hot').find('.wtHider').first()[0], function () {
              // clientController.updateWidth(tables);
            });
            new ResizeSensor($('#service-length-hot').find('.wtHider').first()[0], function () {
              // clientController.updateWidth(tables);
            });
          }

          clientController.updateWidth(tables, !attach);
        }

        function addValidationErrors(msg) {
          $verify.prop('checked', false);
          $('#submit').prop('disabled', true);
          $('#errors').css('display', 'block');

          for (var i = 0; i < msg.length; i++) {
            $('#validation-errors').append('<li><span class="help-block">' + msg[i] + '</span></li>');
          }
        }

        // Register when ready
        tables[0].addHook('afterChange', afterChange);
        for (var i = 0; i < tables.length - 1; i++) {
          tables[i].addHook('afterChange', function (changes, sources) {
            if (changes !== null) {
              $verify.prop('checked', false);
            }
          });
        }

        // Button clicks handlers
        $verify.click(function () {
          var la = Ladda.create(document.getElementById('verify'));
          la.start();

          clientController.validate(tables, function (result, msg) {
            $('#validation-errors').empty();
            la.stop();
            if (result) {
              $('#submit').prop('disabled', false);
              $('#errors').css('display', 'none');
            } else {
              addValidationErrors(msg);
            }
          });
        });

        $('#submit').click(function () {
          var la = Ladda.create(document.getElementById('submit'));
          la.start();

          clientController.validate(tables, function (result, msg) {
            $('#validation-errors').empty();
            if (!result) {
              la.stop();
              addValidationErrors(msg);
            } else {
              clientController.constructAndSend(tables, la);
            }
          });
        });
      });

      /* global $buoop */
      var $buoop = {
        vs: {i: 10, f: -4, o: -4, s: 8, c: -4},
        mobile: false,
        api: 4,
        noclose: true,
        reminder: 0,
        reminderClosed: 0,
        text: '<strong>Your web browser {brow_name} is not supported.</strong> Please upgrade to a more modern browser to participate in the 100% Talent Data Submission.'
      };

      function $buo_f() {
        var e = document.createElement('script');
        e.src = '//browser-update.org/update.min.js';
        document.body.appendChild(e);
      }

      try {
        document.addEventListener('DOMContentLoaded', $buo_f, false)
      } catch (e) {
        window.attachEvent('onload', $buo_f)
      }
    }

    return clientControllerView;

  });
