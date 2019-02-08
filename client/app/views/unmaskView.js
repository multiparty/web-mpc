/*eslint no-console: ["error", { allow: ["warn", "error"] }] */

define(['jquery', 'controllers/jiffController', 'controllers/tableController', 'helper/drop_sheet', 'alertify', 'table_template'],
  function ($, jiffController, tableController, DropSheet, alertify, table_template) {
    function error(msg) {
      alertify.alert('<img src="/images/cancel.png" alt="Error">Error!', msg);
    }

    function handle_file(event) {
      var f;

      if (event.type === 'drop') {
        f = event.dataTransfer.files[0];
      } else if (event.type === 'change') {
        f = event.target.files[0];
      }

      if (f) {

        var keyReader = new FileReader();
        keyReader.readAsText(f);

        $(keyReader).on('load', function (e) {
          var sessionKey = $('#session').val();
          var sessionPass = $('#session-password').val();
          var privateKey = e.target.result;

          jiffController.analyst.computeAndFormat(sessionKey, sessionPass, privateKey, error, function (result) {     
            console.log('result', result);
            var questions = result['questions'];
            // var usability = result['usability'];
            // console.log('result',result);
            // delete result['usability'];
            delete result['questions'];

            // console.log(usability);
            tableController.createTableElems(table_template.tables, '#tables-area');
            tableController.saveTables(result, sessionKey);
            if (questions != null) {
              tableController.saveQuestions(questions, sessionKey);
            }

            $('#tables-area').show();
            tableController.displayReadTable(result);
          });
        });
      }
    }

    function expandTable() {
      var expand_button = $('#expand-table-button');

      $(expand_button).click(function () {

        var ta = $('#tables-area');

        if (ta.css('display') === 'none') {
          ta.show();
          var maxWidth = $('.wtHider').width() + 50;
          tableController.updateTableWidth(maxWidth)
        } else {
          ta.hide();
          tableController.resetTableWidth()
        }
      });
    }

    function unmaskView() {
      $(document).ready(function () {
        $('#tables-area').hide();
        expandTable();

        var _target = document.getElementById('drop-area');
        var _choose = document.getElementById('choose-file-button');

        DropSheet({
          drop: _target,
          choose: _choose,
          on: {},
          errors: {},
          handle_file: handle_file
        });
      });
    }

    return unmaskView;
  }
);
