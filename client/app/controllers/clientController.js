/* global alertify, $ */
define(['jquery', 'controllers/tableController', 'controllers/jiffController', 'controllers/usabilityController', 'alertify', 'alertify_defaults', 'table_template'],
  function ($, tableController, jiffController, usabilityController, alertify, _, table_template) {
    var client = (function () {
      /**
       * Displays the given submission as the last submission in
       * the HTML submission history panel
       */
      function appendSubmissionHistory(time, status) {
        var $submissionHistory = $('#submission-history');
        if (status) {
          // append success line
          $submissionHistory.append('<li><span class="success"><img src="/images/accept.png" alt="Success">Successful - ' + time + '</span></li>')
        } else {
          $submissionHistory.append('<li><span class="error"><img src="/images/cancel.png" alt="Error">Unsuccessful - ' + time + '</span></li>')
        }
      }

      /**
       * Error messages definitions
       */
      var SUCCESS_MESSAGE = 'Submitted data.';
      var SESSION_KEY_ERROR = 'Invalid session number';
      var PARTICIPATION_CODE_ERROR = 'Invalid participation code';

      var SESSION_PARTICIPATION_CODE_SERVER_ERROR = 'Session number and participation code do not match';

      var UNCHECKED_ERR = 'Please acknowledge that all data is correct and verified';
      var ADD_QUESTIONS_ERR = 'Please answer all Additional Questions';

      var GENERIC_TABLE_ERR = 'Please double-check the "%s" table';
      var SERVER_ERR = 'Server not reachable';
      var GENERIC_SUBMISSION_ERR = 'Something went wrong with submission! Please try again';

      var NAN_EMPTY_CELLS = 'You have entered non-numeric data into at least one cell. Please make sure all cells contain positive numbers only. If you have no data for that cell, please enter a zero.';
      var SEMANTIC_CELLS = 'You have entered data into a cell in one table without entering data into the corresponding cell in another table. Please double check all tables';
      var CELLS_ERRORS = {
        empty: NAN_EMPTY_CELLS,
        type: NAN_EMPTY_CELLS,
        min: NAN_EMPTY_CELLS,
        discrepancies: SEMANTIC_CELLS
      };
      // TODO: create new view for alerts
      function error(msg) {
        appendSubmissionHistory(new Date(), false);
        alertify.alert('<img src="/images/cancel.png" alt="Error">Error!', msg);
      }
      function success(msg) {
        appendSubmissionHistory(new Date(), true);
        alertify.alert('<img src="/images/accept.png" alt="Success">Success!', msg);
      }

      /**
       * Validate the session and participation code input fields.
       */
      function validateSessionInput(element, checkServerFlag) {
        element = $(element);
        var pattern = new RegExp($(element).prop('pattern'));
        var $parent = element.parent();

        if (element.val().trim().toLowerCase().match(pattern)) {
          $parent.removeClass('has-error').addClass('has-success has-feedback');
          $parent.find('.success-icon').removeClass('hidden').addClass('show');
          $parent.find('.fail-icon').removeClass('show').addClass('hidden');
          $parent.find('.fail-help').removeClass('show').addClass('hidden');
          $parent.find('.fail-custom').removeClass('show').addClass('hidden');
          if (checkServerFlag) {
            verifySessionServer();
          }
          return true;
        } else {
          $parent.removeClass('has-success').addClass('has-error has-feedback');
          $parent.find('.success-icon').removeClass('show').addClass('hidden');
          $parent.find('.fail-icon').removeClass('hidden').addClass('show');
          $parent.find('.fail-help').removeClass('hidden').addClass('show');
          $parent.find('.fail-custom').removeClass('show').addClass('hidden');
          return false;
        }
      }
      function verifySessionServer(callback) {
        var session = $('#session').val().trim().toLowerCase();
        var participationCode = $('#participation-code').val().trim().toLowerCase();

        if (session === '' || participationCode === '') {
          callback && callback(false);
          return;
        }

        $.ajax({
          type: 'POST',
          url: '/sessioninfo',
          contentType: 'application/json',
          data: JSON.stringify({session: session, userkey: participationCode}),
          dataType: 'text'
        }).then(function (response) {
          JSON.parse(response); // verify response is json (error responses are string messages)

          var $parent = $('#session, #participation-code').parent();
          $parent.removeClass('has-error').addClass('has-success has-feedback');
          $parent.find('.success-icon').removeClass('hidden').addClass('show');
          $parent.find('.fail-icon').removeClass('show').addClass('hidden');
          $parent.find('.fail-help').removeClass('show').addClass('hidden');
          $parent.find('.fail-custom').removeClass('show').addClass('hidden');
          callback && callback(true);
        }).catch(function (err) {
          var errorMsg = SERVER_ERR;
          if (err && err.hasOwnProperty('responseText') && err.responseText !== undefined) {
            errorMsg = err.responseText;
          }

          var $parent = $('#session, #participation-code').parent();
          $parent.removeClass('has-success').addClass('has-error has-feedback');
          $parent.find('.success-icon').removeClass('show').addClass('hidden');
          $parent.find('.fail-icon').removeClass('hidden').addClass('show');
          $parent.find('.fail-help').removeClass('show').addClass('hidden');
          $parent.find('.fail-custom').removeClass('hidden').addClass('show').html(errorMsg);
          callback && callback(false);
        });
      }

      /**
       * Called when the submit button is pressed.
       */
      function validate(tables, callback) {
        var errors = [];
        // Verify session key
        var $session = $('#session');
        if (!validateSessionInput($session, false)) {
          errors.push(SESSION_KEY_ERROR);
        }

        var $participationCode = $('#participation-code');
        if (!validateSessionInput($participationCode, false)) {
          errors.push(PARTICIPATION_CODE_ERROR);
        }

        // Validate the remaining components after session and
        // and participation code are validated with the server.
        var validateRemainingComponents = function (result) {
          if (!result) {
            errors.push(SESSION_PARTICIPATION_CODE_SERVER_ERROR);
          }

          // Verify confirmation check box was checked
          var verifyChecked = $('#verify').is(':checked');
          if (!verifyChecked) {
            errors.push(UNCHECKED_ERR);
          }

          // Verify additional questions
          if (table_template.survey != null) {
            var questionsValid = true;
            var questions = $('#questions form');
            for (var q = 0; q < questions.length; q++) {
              var thisQuestionIsValid = false;
              var radios = $(questions[q]).find('input[type=radio]');
              for (var r = 0; r < radios.length; r++) {
                if (radios[r].checked) {
                  thisQuestionIsValid = true;
                  break;
                }
              }

              if (!thisQuestionIsValid) {
                questionsValid = false;
                $(questions[q]).addClass('has-error');
              } else {
                $(questions[q]).removeClass('has-error');
              }
            }
            if (!questionsValid) {
              errors.push(ADD_QUESTIONS_ERR);
            }
          }

          // Pacesetters deployment does not use this validator in the template
          // this will only affect BWWC
          tableController.registerValidator('discrepancies', function (table, cell, value, callback) {
            checkSemanticDiscrepancies(tables, table, cell, value, callback);
          });

          // Receive errors from validator and puts them in the errors array.
          var errorHandler = function (table_name, value, row, col, validator_name) {
            var errorMsg;
            if (validator_name === 'type' && value === '') {
              errorMsg = CELLS_ERRORS['empty'];
            } else {
              errorMsg = CELLS_ERRORS[validator_name];
            }

            if (errorMsg === null) {
              errorMsg = GENERIC_TABLE_ERR;
              errorMsg = errorMsg.replace('%s', table_name);
            }
            if (errors.indexOf(errorMsg) === -1) {
              errors.push(errorMsg);
            }
          };
          tableController.registerErrorHandler(errorHandler);

          // Validate tables (callback chaining)
          (function validate_callback(i) {
            if (i >= tables.length) {
              // Remove the semantic discrepancies validator.
              tableController.removeValidator('discrepancies');
              tableController.removeErrorHandler(0);
              for (i = 0; i < tables.length; i++) {
                tables[i].render();
              }

              if (errors.length === 0) {
                return callback(true, '');
              } else {
                return callback(false, errors);
              }
            }

            // Dont validate tables that are not going to be submitted
            if (tables[i]._sail_meta.submit === false) {
              return validate_callback(i + 1);
            }

            tables[i].validateCells(function (result) { // Validate table
              validate_callback(i + 1);
            });
          })(0);
        };

        if (errors.length === 0) {
          verifySessionServer(validateRemainingComponents);
        } else {
          validateRemainingComponents(true);
        }
      }

      /**
       * All inputs are valid. Construct JSON objects and send them to the server.
       */
      function constructAndSend(tables, la) {
        // Begin constructing the data
        var questions = $('#questions form');
        var data_submission = questions.length ? {questions: {}} : {};
        var questions_public = {};

        var session = $('#session').val().trim().toLowerCase();
        var participationCode = $('#participation-code').val().trim().toLowerCase();

        // Add questions data, each question has three parts:
        //  'YES', 'NO', and 'NA' and each one has value 0 or 1
        var questions_text = questions.find('.question-text');
        var questions_values = [];
        for (var q = 0; q < questions.length; q++) {
          var question_data = {};
          var radios = $(questions[q]).find('input[type=radio]');
          for (var r = 0; r < radios.length; r++) {
            var value = radios[r].value;
            value = value.replace(/\s+/g, ' ');
            question_data[value] = (radios[r].checked ? 1 : 0);
            if (radios[r].checked) {
              questions_values.push(value);
            }
          }

          var text = $(questions_text[q]).text();
          text = text.replace(/\s+/g, ' '); // Replace many white spaces with just one space.
          data_submission['questions'][text] = question_data;
          questions_public[text] = Object.assign({}, question_data);
      
          console.log('analytics',usabilityController.analytics);

        }

        // Handle table data, tables are represented as 2D associative arrays
        // with the first index being the row key, and the second being the column key
        var tables_data = tableController.constructDataTables(tables);
        for (var i = 0; i < tables_data.length; i++) {
          data_submission[tables_data[i].name] = tables_data[i].data;
        }

        data_submission['usability'] = usabilityController.analytics;
        
        // Secret share / mask the data.
        jiffController.client.submit(session, participationCode, data_submission, function (err, response) {
          if (err == null || err === 200) {
            response = JSON.parse(response);
            if (response.success) {
              if (document.getElementById('choose-file').files.length > 0) {
                usabilityController.dataPrefilled();
              }
              success(SUCCESS_MESSAGE);
            } else {
              error(response.error);
            }
          } else if (err === 0 || err === 500) {
            // check for status 0 or status 500 (Server not reachable.)
            error(SERVER_ERR);
          } else {
            error(GENERIC_SUBMISSION_ERR);
          }

          la.stop();
        });
      }

      /**
       * Custom validator that checks for semantic discrepancies across many tables. In particular:
       * 1. For all tables except bonus (3rd table), the cell must be either zero in all tables, or non-zero in all tables.
       * 2. For the bonus table (3rd table), it can only be non-zero if the other tables are non-zero.
       */
      function checkSemanticDiscrepancies(tables, table, cell, value, callback) {
        // var num_regex = /$[0-9]+^/; // no need to worry about empty spaces, hot removes them for number types.
        var bonus_table = tables[2];
        var name = table._sail_meta.name;
        var r = cell.row_index;
        var c = cell.col_index;

        // Ignore indices were there is some non-numerical value
        for (var i = 0; i < tables.length - 1; i++) {
          var v = tables[i].getDataAtCell(r, c);
          if (typeof(v) !== 'number' || v < 0) {
            return callback(true);
          }
        }

        // bonus can only be non-zero if the other tables are non-zero.
        if (name === bonus_table._sail_meta.name) {
          // bonus can only be non-zero if the other tables are non-zero.
          if (value > 0) {
            for (var j = 0; j < tables.length - 1; j++) { // length-1 because of the totals table
              if (j === 2) {
                continue;
              }

              if (!(tables[j].getDataAtCell(r, c) > 0)) {
                return callback(false); // No need to invalidate other cells here.
              }
            }
          }
        } else { // Not bonus table

          // the cell must be either zero in all tables, or non-zero in all tables
          var compare = value > 0;
          for (i = 0; i < tables.length - 1; i++) { // length-1 because of the totals table
            if (name === tables[i]._sail_meta.name) {
              continue;
            }

            if (i === 2) { // bonus table can only be greater than zero if this value is greater than 0.
              if (tables[i].getDataAtCell(r, c) > 0 && !compare) {
                return callback(false);
              }
            } else if ((tables[i].getDataAtCell(r, c) > 0) !== compare) {
              return callback(false);
            }
          }
        }

        callback(true);
      }

      return {
        validate,
        constructAndSend,
        validateSessionInput,
      };
    })();

    return client;
});
