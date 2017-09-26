define(['jquery', 'controllers/unmaskController', 'helper/sail_hot', 'Ladda'], function ($, unmaskController, sailHOT, Ladda) {

  function unmaskView() {

    $(document).ready(function () {
      //$('#friendly').hide();

      $.ajax({
        type: 'GET',
        url: '/templates/tables.json',
        dataType: 'json'
      }).then(function (tables_def) {
        var tables = sailHOT.make_tables(tables_def);
        window.scrollTo(0, 0);
        var tables_map = {};
        for (var v = 0; v < tables.length; v++) {
          tables_map[tables[v]._sail_meta.name] = tables[v];
        }

        //$('#friendly').hide();
        $('#unmask').removeAttr('disabled');

        // Handler for unmasking
        $('#unmask').on('click', function () {
          var maskKey = $('#maskKey').get(0),
            sessKey = $('#sessKey').val(),
            password = $('#password').val(),
            la = Ladda.create(this),
            keyReader = new FileReader();

          if (maskKey.files.length) {
            la.start();
            keyReader.readAsText(maskKey.files[0]);
            $(keyReader).on('load', function (e) {
              var privateKey = e.target.result;

              // Callback: display results in HOT
              var callb = function (success, data) {
                la.stop();

                if (success) { // Display result
                  for (var name in data) {
                    if (!(data.hasOwnProperty(name))) {
                      continue;
                    }

                    var table = tables_map[name];
                    if (table) { // This is a table field

                      var table_data = data[name];
                      sailHOT.remove_validators(table);
                      sailHOT.fill_data(table_data, table);
                      sailHOT.read_only_table(table, true);

                      // Show tables
                      $('#' + table._sail_meta.element).show();
                      $('#' + table._sail_meta.element + '-name').show();

                    } else { // Not a table, questions
                      var fields = data[name];

                      var h3 = $('<h3>').text(toTitleCase(name));
                      $('#' + name).append(h3);
                      h3.show();

                      for (var field in fields) {
                        if (!(fields.hasOwnProperty(field))) {
                          continue;
                        }


                        var ul = $('<ul>');
                        var answers = fields[field];
                        for (var option in answers) {
                          if (!(answers.hasOwnProperty(option))) {
                            continue;
                          }

                          var text = option + ': ' + answers[option];
                          ul.append($('<li>').text(text));
                        }

                        $('#' + name).append($('<h4>').text(field));
                        $('#' + name).append(ul);
                        $('#' + name).append($('<br>'));
                        $('#' + name).show();
                      }
                    }
                  }

                  // Display raw data.
                  //$('#result').text(JSON.stringify(data, null, 4));
                  //$('#result').show();
                  $('#error').hide();
                  $('#unmask').prop('disabled', true);
                  $('#unmask').hide();
                } else { // !success, display error
                  // console.log(data);
                  $('#error').text(data);
                  $('#error').show();
                }
              };

              // Remove top and bottom line of pem file
              privateKey = privateKey.split('\n')[1];

              $.ajax({
                type: 'POST',
                url: '/get_masks',
                contentType: 'application/json',
                data: JSON.stringify({session: sessKey, password: password}),
                success: function (data) {
                  unmaskController.aggregate_and_unmask(data, privateKey, sessKey, password, callb);
                },
                error: function () {
                  callb(false, 'Error: failed to load masks');
                }
              });
            });
          } else {
            alert('Please upload both files before continuing.');
          }
        });
      });
    });

    // Capitalize the first letter of every word
    function toTitleCase(str) {
      return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }

    /*global getParameterByName b:true*/

    // TODO: clean this function up
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
