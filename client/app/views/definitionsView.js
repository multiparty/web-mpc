define(['jquery', 'Handsontable', 'table_template'], function ($, Handsontable, tableTemplate) {

  function definitionsView() {
    function createTableHeader($tableDiv, headers) {
      var $header = document.createElement('tr');
      for (var i = 0; i < headers.length; i++) {
        var $td = document.createElement('td');
        $td.innerText = headers[i];
        $td.setAttribute('class', 'font-weight-bold');
        $header.append($td);
      }
      $tableDiv.append($header);
    }

    function createTable($tableDiv, table) {
      for (var i = 0; i < table.length; i++) {
        var $tr = document.createElement('tr');

        for (var j = 0; j < table[i].length; j++) {
          var $td = document.createElement('td');
          $td.innerText = table[i][j];

          if (j === 0) {
            $td.setAttribute('class', 'font-weight-bold')
          }

          $tr.append($td);
        }
        $tableDiv.append($tr);
      }
    }

    $(document).ready(function () {
      $("#definitions").append('<h2 class="text-center">' + tableTemplate.definitions.title + '</h2>')

      var $tableDiv = document.getElementById('definitions-table');
      createTableHeader($tableDiv, tableTemplate.definitions.headers);
      createTable($tableDiv, tableTemplate.definitions.table);

      document.getElementById('definitions').append($tableDiv);
    });
  }

  return definitionsView;
});
