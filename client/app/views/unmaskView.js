/*eslint no-console: ["error", { allow: ["warn", "error"] }] */

define(['jquery', 'controllers/unmaskController', 'controllers/clientController', 'controllers/tableController', 'helper/drop_sheet', 'spin', 'Ladda', 'ResizeSensor', 'alertify', 'table_template'],
  function ($, unmaskController, clientController, tableController, DropSheet, Spinner, Ladda, ResizeSensor, alertify, alertify_defaults, table_template) {

    function error(msg) {
      alertify.alert('<img src="/images/cancel.png" alt="Error">Error!', msg);
    }


    function callb(e, d, questions, session) {
      var tables = {};
      for (var name in d) {
        if (name !== 'questions') {
          // var table = tables_map[name];
          var data_array = tableController.fillData(d[name]);
          tables[name] = data_array;
        }
      }

      tableController.saveTables(tables, session);
      tableController.saveQuestions(questions, session);
      tableController.displayReadTable(tables);
      // TODO: why is this even here?
      $('#HandsontableCopyPaste').hide();

    }


    function getMasks(sK, sP, pK) {
      $.ajax({
        type: 'POST',
        url: '/get_masks',
        contentType: 'application/json',
        data: JSON.stringify({session: sK, password: sP}),
        success: function (data) {
          unmaskController.aggregate_and_unmask(data, pK, sK, sP, callb);
        },
        error: function (e) {
          error(e.responseText);
        }
      });
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

          privateKey = privateKey.split('\n')[1];

          getMasks(sessionKey, sessionPass, privateKey);
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

  });
