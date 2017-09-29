define(['jquery', 'controllers/unmaskController', 'controllers/clientController', 'controllers/tableController', 'helper/drop_sheet', 'spin', 'Ladda', 'ResizeSensor', 'alertify', 'table_template'],
function($, unmaskController, clientController, tableController, DropSheet, Spinner, Ladda, ResizeSensor, alertify, table_template) {
  

  function callb(e, d, questions,session) {
    var tables = {};
    for (var name in d) {
      if (name !== 'questions') {
        // var table = tables_map[name];
        var data_array = tableController.fill_data(d[name]);
        tables[name] = data_array;     
      }
    }

    tableController.save_tables(tables, session);
    tableController.save_questions(questions, session);
    tableController.displayReadTable(tables);

    // display HoT

  }



  function getMasks(sK, sP, pK) {
    $.ajax({
      type: 'POST',
      url: '/get_masks',
      contentType: 'application/json',
      data: JSON.stringify({session: sK, password: sP}),
      success: function(data) {
        unmaskController.aggregate_and_unmask(data, pK, sK, sP, callb);
      },
      error: function() {
        // TODO:
        console.log("FAILED")
      }
    });
  }

  function handle_file(event) {
    var f = event.target.files[0];
    if (f) {
  
      var keyReader = new FileReader();
      keyReader.readAsText(f);

      $(keyReader).on('load', function(e) {
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
    var ta = $('#tables-area');

    $(expand_button).click(function() {

      var ta = $('#tables-area');
      if (ta.css('display') === 'none') {
        ta.show();
      } else {
        ta.hide();
      }
      // if (ta.css.('display') === 'none') {

      // } else {

      // }
      // if (ta.css.('display') === 'none') {
      //   $('#tables-area').show();
      // } else {
      //   $('#tables-area').hide();
      // }  
    });
    // $(expand_button).addEventListener('click', function () {
    //   console.log("HELLO")
    // });


    // $(expand_button).addEventListener('click', function() {
   
    // });
  }

  function unmaskView() {
    
    $(document).ready(function() {
      $('#tables-area').hide();
      expandTable();

      var _target = document.getElementById('drop-area');
      var _choose = document.getElementById('choose-file-button');
      var spinner;

      var _workstart = function () {
        if ($('#tables-area').css('display') !== 'none') {
          $('#tables-area').hide();
          $('#expand-table-button').toggleClass('flip');
          resizeCard(tables,false);
        }
        spinner = new Spinner().spin(_target);
      }

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
