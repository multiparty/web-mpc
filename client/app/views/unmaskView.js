define(['jquery', 'controllers/unmaskController', 'controllers/clientController', 'controllers/tableController', 'helper/drop_sheet', 'spin', 'Ladda', 'ResizeSensor', 'alertify', 'table_template'],
function($, unmaskController, clientController, tableController, DropSheet, Spinner, Ladda, ResizeSensor, alertify, table_template) {
  
  // TODO: fix this
  var tables_map;

  function callb(e, d) {
    var tables = {};
    for (name in d) {
      if (name !== 'questions') {
        var table = tables_map[name];
        var data_array = tableController.fill_data(d[name], table);
        tables[name] = data_array;     
      }
    }
    tableController.save_tables(tables);
  }

  function getMasks(sK, sP, pK) {
    console.log(sK, sP)
    $.ajax({
      type: 'POST',
      url: '/get_masks',
      contentType: 'application/json',
      data: JSON.stringify({session: sK, password: sP}),
      success: function(data) {
        unmaskController.aggregate_and_unmask(data, pK, sK, sP, callb);
        // la.stop();
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

    
    
    //   $(keyReader).on('load', function(e) {
    //     console.log('e',event.target);
    //   });
    // }
  }

  function unmaskView() {
    


    $(document).ready(function() {
      $('#tables-area').hide();
      // TODO: MOVE THIS TO CALLBACK
      var tables = tableController.make_tables();
      tables_map = {};
      for (var v = 0; v < tables.length; v++) {
        tables_map[tables[v]._sail_meta.name] = tables[v];
      }

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


      // // TODO: WHY?!?!?
      // var _unmask = $('#unmask-button')[0];

      // var _file = $('#choose-file')[0]
      

      // _file.addEventListener('click', function(e) {
      //   console.log
      //   // file_path = $('#choose-file').val();
        // if (file_path) {
        //   console.log(file_path);
        //   handleFile(file_path);
        // } else {
        //   // TODO: get alertify working
        //   alert("NO PEM")
        //   alertify.alert('<img src="/images/cancel.png" alt="Error">Error!', 'Missing private key file', function (){
        //   });
        // }
      // });

      DropSheet({
        drop: _target,
        choose: _choose,
        // tables: tables,
        // tables_def: table_template,
        on: {},
        errors: {},
        handle_file: handle_file
      });
    });
  }

  return unmaskView;

});


// define(['jquery','controllers/unmaskController', 'controllers/clientController', 'helper/sail_hot', 'helper/drop_sheet', 'spin', 'Ladda', 'ResizeSensor', 'alertify'], 
// function ($, unmaskController, clientController, sailHOT, DropSheet, Spinner, Ladda, ResizeSensor, alertify) {
//   function resizeCard(tables, attach) {
//     if (attach) {
//       new ResizeSensor($('#number-employees-hot').find('.wtHider').first()[0], function () {
//         clientController.updateWidth(tables);
//       });
//       new ResizeSensor($('#compensation-hot').find('.wtHider').first()[0], function () {
//         clientController.updateWidth(tables);
//       });
//       new ResizeSensor($('#performance-pay-hot').find('.wtHider').first()[0], function () {
//         clientController.updateWidth(tables);
//       });
//       new ResizeSensor($('#service-length-hot').find('.wtHider').first()[0], function () {
//         clientController.updateWidth(tables);
//       });
//     }

//     clientController.updateWidth(tables, !attach);
//   }

//   function callb() {
//     console.log("CALLBAAAACK")
//     var req = $.ajax({
//       type: 'GET',
//       url: 'templates/tables.json',
//       dataType: 'json'
//     }).then(function (tables_def) {
//       console.log()
//       var tables = sailHOT.make_tables(tables_def);
//       window.scrollTo(0,0);
//       var tables_map = {};

//       for (var v = 0; v < tables.length; v++) {
//         tables_map[tables[v]._sail_meta.name] = tables[v];
//       }
//       console.log('tm',tables_map);
  
//       $('#expand-table-button').click(function (e) {
//         $('#tables-area').slideToggle(function () {
//           if ($('#tables-area').css('display') === 'none') {
//             resizeCard(tables, false);
//           } else {
//             resizeCard(tables, true);
//           }
//         });
//         $(e.target).toggleClass('flip');
//       });
//     });
    


//   }



//   function handleFile(f) {
//     if (!f.name) {
//       f = f.target.files[0]
//     }
//     // TODO
//     la = Ladda.create(this);
//     la.start();
    
//     if (f) {
//       var keyReader = new FileReader()
//       keyReader.readAsText(f);

//       $(keyReader).on('load', function (event){

//         var sessionKey = $('#session').val();
//         var sessionPassword = $('#session-password').val();
//         var privateKey = event.target.result;
   
//         privateKey = privateKey.split('\n')[1];

  
//         $.ajax({
//           type: 'POST',
//           url: '/get_masks',
//           contentType: 'application/json',
//           data: JSON.stringify({session: sessionKey, password: sessionPassword}),
//           success: function(data) {
//             unmaskController.aggregate_and_unmask(data, privateKey, sessionKey, sessionPassword, callb);
//             la.stop();
//           },
//           error: function() {
//             // TODO:
//             console.log("FAILED")
//           }
//         });
//       });
//     }
//   }

//   function handleDragover(e) {

//     if (typeof jQuery !== 'undefined') {
//       e.stopPropagation();
//       e.preventDefault();
//       e.dataTransfer.dropEffect = 'copy';
//       $('#drop-area').removeClass('dragdefault');
//       $('#drop-area').addClass('dragenter');
//     } else {
//       alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", "Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
//     }
//   }

//   function handleDragLeave(e) {
//       if (typeof jQuery !== 'undefined') {
//         $('#drop-area').removeClass('dragenter');
//       } else {
//         alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", "Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
//       }
//   }


//   function dropSheetListen() {
    
//     $('#unmask').removeAttr('disabled');
//     var target = document.getElementById('drop-area');
//     if (target) {

//       target.addEventListener('click', function(){
//         $('#choose-file').click();
//         $('#choose-file').change(handleFile);
      
//       });

//       target.addEventListener('drop', function(e) {
//         if (typeof jQuery) {
//           e.stopPropagation();
//           e.preventDefault();
//         }

//         // check if pending?
//         var files = e.dataTransfer.files;
//         handleFile(files[0])
//       });

//       target.addEventListener('dragenter', handleDragover, false);
//       target.addEventListener('dragleave', handleDragLeave);
//       target.addEventListener('dragover', handleDragover, false);

//     }
//   }



//   function unmaskView() {
      
//     $(document).ready(function () {
//       $('#tables-area').hide();

//       // var req = $.ajax({
//       //   type: 'GET',
//       //   url: '/templates/tables.json',
//       //   dataType: 'json'
//       // }).then(function (tables_def) {

    
//       dropSheetListen();
//     });

//     // Capitalize the first letter of every word
//     function toTitleCase(str) {
//       return str.replace(/\w\S*/g, function (txt) {
//         return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
//       });
//     }

//     // taken directly from trusted/session_data.html.
//     // could probably clean up
//     window.getParameterByName = function (name) {
//       name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
//       var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
//         results = regex.exec(location.search);
//       return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
//     }

//     if (getParameterByName('session')) {
//       $('#sessKey').val(getParameterByName('session'));
//     }

//     // We can attach the `fileselect` event to all file inputs on the page
//     $(document).on('change', ':file', function () {
//       var input = $(this),
//         label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
//       input.trigger('fileselect', [label]);
//     });

//     $(':file').on('fileselect', function (event, label) {
//       var input = $(this).parents('.input-group').find('#filename');
//       if (input.length) {
//         input.text(label);
//       }
//     });
//   }
  
//   return unmaskView;

// });