define(['jquery','controllers/unmaskController', 'helper/sail_hot', 'helper/drop_sheet', 'spin', 'Ladda', 'alertify'], 
function ($, unmaskController, sailHOT, DropSheet, Spinner, Ladda, alertify) {

  function callb() {
    $("#tables-area").show();
  }

  function handleFile(f) {
    if (!f.name) {
      f = f.target.files[0]
    }
    
    if (f) {
      var keyReader = new FileReader()
      keyReader.readAsText(f);

      $(keyReader).on('load', function (event){

        var sessionKey = $('#session').val();
        var sessionPassword = $('#session-password').val();
        var privateKey = event.target.result;
   
        privateKey = privateKey.split('\n')[1];

        $.ajax({
          type: 'POST',
          url: '/get_masks',
          contentType: 'application/json',
          data: JSON.stringify({session: sessionKey, password: sessionPassword}),
          success: function(data) {
            unmaskController.aggregate_and_unmask(data, privateKey, sessionKey, sessionPassword, callb)
          },
          error: function() {
            // TODO:
            console.log("FAILED")
          }
        });
      });
    }
  }

  function handleDragover(e) {

    if (typeof jQuery !== 'undefined') {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      $('#drop-area').removeClass('dragdefault');
      $('#drop-area').addClass('dragenter');
    } else {
      alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", "Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
    }
  }

  function handleDragLeave(e) {
      if (typeof jQuery !== 'undefined') {
        $('#drop-area').removeClass('dragenter');
      } else {
        alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", "Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
      }
  }


  function dropSheetListen() {
    
    $('#unmask').removeAttr('disabled');
    var target = document.getElementById('drop-area');
    if (target) {

      target.addEventListener('click', function(){
        $('#choose-file').click();
        $('#choose-file').change(handleFile);
      
      });

      target.addEventListener('drop', function(e) {
        if (typeof jQuery) {
          e.stopPropagation();
          e.preventDefault();
        }

        // check if pending?
        var files = e.dataTransfer.files;
        handleFile(files[0])
      });

      target.addEventListener('dragenter', handleDragover, false);
      target.addEventListener('dragleave', handleDragLeave);
      target.addEventListener('dragover', handleDragover, false);

    }
  }



  function unmaskView() {
      
    $(document).ready(function () {
      $('#tables-area').hide();

      var req = $.ajax({
        type: 'GET',
        url: '/templates/tables.json',
        dataType: 'json'
      }).then(function (tables_def) {
        // var tables = sailHOT.make_tables(tables_def);
        // window.scrollTo(0, 0);
        // var tables_map = {};
        // for (var v = 0; v < tables.length; v++) {
        //   tables_map[tables[v]._sail_meta.name] = tables[v];
        // }
        dropSheetListen();
      });
    });

    // Capitalize the first letter of every word
    function toTitleCase(str) {
      return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }

    // taken directly from trusted/session_data.html.
    // could probably clean up
    window.getParameterByName = function (name) {
      name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    if (getParameterByName('session')) {
      $('#sessKey').val(getParameterByName('session'));
    }

    // We can attach the `fileselect` event to all file inputs on the page
    $(document).on('change', ':file', function () {
      var input = $(this),
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
      input.trigger('fileselect', [label]);
    });

    $(':file').on('fileselect', function (event, label) {
      var input = $(this).parents('.input-group').find('#filename');
      if (input.length) {
        input.text(label);
      }
    });
  }
  
  return unmaskView;

});