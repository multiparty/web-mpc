define(['jquery', 'table_template'], function ($, tableTemplate) {

  function definitionsView() {
    $(document).ready(function () {
      console.log(tableTemplate.definitions);
      $("#definitions").append('<h2 class"text-center">' + tableTemplate.definitions.title + '</h2>')

      var $tableDiv = document.createElement('table');
      $tableDiv.setAttribute('class', 'table table-striped')
      
      var table = tableTemplate.definitions.table;

      for (var i = 0; i < table.length; i++) {
        var $tr = document.createElement('tr');

        for (var j = 0; j < table[i].length; j++) {

          var $td = document.createElement('td');
          $td.innerText = table[i][j];
          $tr.append($td);
        }
        $tableDiv.append($tr);
      }

      document.getElementById('definitions').append($tableDiv);
    });
  }

  return definitionsView;
});
