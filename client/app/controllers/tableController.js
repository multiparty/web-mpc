define(['jquery', 'Handsontable', 'table_template', 'filesaver', 'alertify', 'qtip'], function ($, Handsontable, table_template, filesaver, alertify) {

  'use strict';

  // Bug in handsontable with two screens.
  // If you move the window between two screen, the document fires a
  // focus/mouse over event. Handsontable handles that event and uses
  // the classList attribute without checking if it is undefined.
  // document has no classList attribute.
  document['classList'] = {};
  document['classList']['contains'] = function () {
    return false;
  };

  // A Map from names to validator functions.
  // The name can be used in the json template to assign
  // the corresponding validator to a cell.
  // The validator functions must follow the header specified by the dummy_template below.
  // Params: table: hands on table object for the table being validated.
  //         cell: a cell object representing the cell being validated.
  //         value: the new value of the cell.
  //         callback: must be used to pass on the result of the validation (true or false).
  //                   failure to call the callback will break how HOT work and the UI to hang in a weird way.
  // The cell object has the following attributes:
  // row_key, col_key, row_index, col_index, type, validators (array of names), max, min, empty (flag), read_only (flag), default, placeholder, tooltip (nest object)
  var validators_map = {
    dummy_template: function (table, cell, value, callback) {
      callback(true);
    }
  };

  // Registers a validator function with a name for use in the json template.
  // May be called before or after template is parsed or the table is created.
  function registerValidator(name, validator) {
    validators_map[name] = validator;
  }

  // Removes a validator function by its name.
  function removeValidator(name) {
    validators_map[name] = null;
  }

  // A Map from names to complex handsontable types.
  // The names can be used in the json template as a shortcut to assign
  // the mapped type information and formatting to a cell.
  var types_map = {
    int: {
      type: 'numeric'
    },

    currency: {
      type: 'numeric',
      format: '$0,0.00',
      language: 'en-US' // this is the default locale, set up for USD
    }
  };


  var table_widths = {};

  // Change this to add additional custom handling of errors when validating.
  var errorHandlers = [];

  /**
   * Add an additional custom error handler. I.e. a function that received notification of validation errors.
   * @param {function(table_name, cell_value, row_index, column_index, validator_name)} handler - the error handler.
   * validator_name could be one of:
   *  1. "min" or "max": for values that are below or above the declared min/max).
   *  2. "type": for values that fail the generic HOT validator (do not match the cell type).
   *  3. some other string: the name of the custom validator that failed according to how it is defined in the json template.
   */
  function registerErrorHandler(handler) {
    errorHandlers.push(handler);
  }

  /**
   * Removes a handler by index.
   * @param {int} index - the index of the handler to remove.
   */
  function removeErrorHandler(index) {
    if (index >= 0 && index < errorHandlers.length) {
      errorHandlers = errorHandlers.splice(index, 1);
    }
  }

  /**
   * Calls all the error handlers with any given arguments.
   */
  function fire_all_error_handlers(table_name, value, row, col, validator_name) {
    for (var i = 0; i < errorHandlers.length; i++) {
      errorHandlers[i](table_name, value, row, col, validator_name);
    }
  }


  /**
   * Generic Validator:
   * HOT by default allows only one validator per cell.
   * However, we want to allow multiple "chained" one, such that all the validators must be sucessfully passed
   * in order to validate a cell.
   * Validators in HOT are asynchronous. Therefore we use validator chaining. I.e. we set up callbacks and pass
   * them to the validators such that every validator calls the next.
   * First we validate the simple attributes provided in the json template: max, min.
   * Then call the default validators that matches the cell's declared Handsontable type.
   * Then call each custom validator and have it invoke the next validator through a callback.
   */
  var validator = function (value, callback) {
    var table = this.instance;
    var cell = table._sail_meta.cells[this.row][this.col];

    // Makes initializing the table faster.
    // Dont validate empty on intialization cells until they receive values.
    if (cell.first_time === undefined) {
      cell.first_time = true;
      cell.status = 'ok';
      callback(true);
      return;
    }

    if (value !== '' && value !== null && cell.max !== null && value > cell.max) {
      fire_all_error_handlers(table._sail_meta.name, value, cell.row_index, cell.col_index, 'max');
      cell.status = 'error';
      callback(false);
      return;
    }

    if (value !== '' && value !== null && cell.min !== null && value < cell.min) {
      fire_all_error_handlers(table._sail_meta.name, value, cell.row_index, cell.col_index, 'min');
      cell.status = 'error';
      callback(false);
      return;
    }

    // Create and call the generic_validator
    // The generic validator is setup such that
    // all validators will be executed one after the other
    // such that the callback passed to every validator is
    // chained into the next one.
    (function generic_validator(value, callback, k) {
      if (k >= cell.validators.length) {
        // No errors, check for warning:
        if (value && cell.max_warning && value > cell.max_warning) {
          cell.status = 'warning';
        } else if (value && cell.min_warning && value < cell.min_warning) {
          cell.status = 'warning';
        } else {
          cell.status = 'ok';
        }

        callback(true);
        return;
      }

      var generic_callback = function (previous_result) {
        if (previous_result) {
          generic_validator(value, callback, k + 1);
        } else {
          if (k === -1) {
            // Default HOT validator according to type.
            fire_all_error_handlers(table._sail_meta.name, value, cell.row_index, cell.col_index, 'type');
          } else {
            // Custom validator.
            fire_all_error_handlers(table._sail_meta.name, value, cell.row_index, cell.col_index, cell.validators[k]);
          }

          cell.status = 'error';
          callback(false); // early break
        }
      };

      if (k > -1) {
        var validator_func = validators_map[cell.validators[k]];
        if (validator_func) {
          validator_func(table, cell, value, generic_callback);
        } else {
          generic_callback(true);
        }
        return;
      }

      // call the default validator
      var hot_cell_type = cell.type;
      if (types_map[cell.type] !== null && types_map[cell.type].type !== null) {
        hot_cell_type = types_map[cell.type].type;
      }

      var hot_type_alias = Handsontable.cellTypes[hot_cell_type];
      if (hot_type_alias !== null && hot_type_alias.validator !== null
        // Fix: if empty values are allowed, and the value is empty do not call default validator.
        && (cell.empty === false || (value !== null && value !== ''))) {

        hot_type_alias.validator(value, generic_callback);
      } else {
        // no default validator
        generic_callback(true);
      }
    })(value, callback, -1);
  };

  /**
   * Custom renderer.
   * The header (parameters) is specified by HOT.
   * This renderer is created to display the appropriate tooltip.
   * If the cell was invalidated then an error tooltip is shown, otherwise the prompt tooltip is shown.
   * Then the default renderer that matches the declared cell type is called.
   */
  var renderer = function (instance, TD, row, col, prop, value, cellProperties) {
    if (!instance._sail_meta) {
      return; // render will be called again
    }

    var cell = instance._sail_meta.cells[row][col];

    // Readonly
    if (cell.read_only !== null) {
      cellProperties.readOnly = cell.read_only;
    }

    // Tooltip
    var tooltip = cell.tooltip;

    // Check for error
    if (cellProperties.valid === false) {

      TD.style.background = '#F06D65';

      if (typeof jQuery !== 'undefined' && typeof jQuery().qtip !== 'undefined') {
        var $TD = $(TD);
        // Remove any previous tooltip
        if ($TD.qtip('api')) {
          $TD.qtip('api').destroy();
        }

        // Setup error tooltip if exists.
        if (tooltip && tooltip.errorTitle !== null && tooltip.errorTitle !== undefined
          && tooltip.error !== null && tooltip.error !== undefined) {

          $TD.qtip({
            style: {classes: 'qtip-red'},
            content: {
              title: tooltip.errorTitle,
              text: '<img src="/images/cancel.png" alt="Error">' + tooltip.error
            },
            show: {
              solo: true,
              event: 'click',
              delay: 30
            },
            hide: {event: 'mouseleave'}
          });
        }
      }
    } else if (cell.status === 'warning') {

      // Check for warning
      TD.style.background = '#FFFF66';

      if (typeof jQuery !== 'undefined' && typeof jQuery().qtip !== 'undefined') {
        $TD = $(TD);
        // Remove any previous tooltip
        if ($TD.qtip('api')) {
          $TD.qtip('api').destroy();
        }

        // Setup warning tooltip if exists.
        if (tooltip && tooltip.warningTitle !== null && tooltip.warningTitle !== undefined
          && tooltip.warning !== null && tooltip.warning !== undefined) {
          $TD.qtip({
            style: {classes: 'qtip-yellow'},
            content: {
              title: tooltip.warningTitle,
              text: '<img src="/images/cancel.png" alt="Warning">' + tooltip.warning
            },
            show: {
              solo: true,
              event: 'click',
              delay: 30
            },
            hide: {event: 'mouseleave'}
          });
        }
      }
    } else {

      // No Warning or Error
      if (typeof jQuery !== 'undefined' && typeof jQuery().qtip !== 'undefined') {
        $TD = $(TD);
        // Remove any previous tooltip
        if ($TD.qtip('api')) {
          $TD.qtip('api').destroy();
        }

        // Setup prompt tooltip if exists.
        if (tooltip && tooltip.promptTitle !== null && tooltip.promptTitle !== undefined
          && tooltip.prompt !== null && tooltip.prompt !== undefined) {
          $TD.qtip({
            style: {classes: 'qtip-light'},
            content: {
              title: tooltip.promptTitle,
              text: tooltip.prompt
            },
            show: {
              solo: true,
              event: 'click',
              delay: 30
            },
            hide: {event: 'mouseleave'}
          });
        }
      }
    }

    // Fallback if no jQuery - use comments.
    if (cellProperties.valid === false) {

      if (tooltip !== undefined && tooltip !== null &&
        tooltip.errorTitle !== undefined && tooltip.errorTitle !== null &&
        tooltip.error !== undefined && tooltip.error !== null &&
        (typeof jQuery === 'undefined' || typeof jQuery().qtip === 'undefined')) {

        cellProperties.comment = {value: tooltip.errorTitle.toUpperCase() + ' - ' + tooltip.error};
      } else {
        cellProperties.comment = null;
      }
    } else if (cell.status === 'warning') {

      if (tooltip !== undefined && tooltip !== null &&
        tooltip.warningTitle !== undefined && tooltip.warningTitle !== null &&
        tooltip.warning !== undefined && tooltip.warning !== null &&
        (typeof jQuery === 'undefined' || typeof jQuery().qtip === 'undefined')) {

        cellProperties.comment = {value: tooltip.warningTitle.toUpperCase() + ' - ' + tooltip.warning};
      } else {
        cellProperties.comment = null;
      }
    } else {

      if (tooltip !== undefined && tooltip !== null &&
        tooltip.promptTitle !== undefined && tooltip.promptTitle !== null &&
        tooltip.prompt !== undefined && tooltip.prompt !== null &&
        (typeof jQuery === 'undefined' || typeof jQuery().qtip === 'undefined')) {

        cellProperties.comment = {value: tooltip.promptTitle.toUpperCase() + ' - ' + tooltip.prompt};
      } else {
        cellProperties.comment = null;
      }
    }

    // Call the default renderer
    var baseRenderer = Handsontable.cellTypes['text'].renderer;
    var hot_cell_type = cell.type;
    if (types_map[cell.type] !== null && types_map[cell.type].type !== null) {
      hot_cell_type = types_map[cell.type].type;
    }

    var hot_type_alias = Handsontable.cellTypes[hot_cell_type];
    if (hot_type_alias !== null && hot_type_alias.renderer !== null) {
      baseRenderer = hot_type_alias.renderer;
    }

    baseRenderer.apply(this, arguments); // call default renderer that matches the type.
  };

  /**
   * Creates hands-on-tables from the given definition.
   * @return {array} containing HOT tables (table_obj may be accesed using hot_table._sail_meta).
   */

  function makeTables() {
    var result = [];
    for (var t = 0; t < table_template.tables.length; t++) {
      var table_def = table_template.tables[t];
      var table = makeTableObj(table_def);

      result[t] = makeHotTable(table);
      table_widths[result[t].rootElement.id] = get_width(result[t]);
    }
    return result;
  }

  /**
   * Creates a hands-on-table from the given definition.
   * @param {json} table_def - the json object representing the table.
   * @return {object} an object representing the table
   */
  function makeTableObj(table_def) {
    var table_name = table_def.name;
    var element = table_def.element;
    var width = table_def.width;
    var submit = table_def.submit;
    var hot_parameters = table_def.hot_parameters;

    if (!(table_def.submit === true || table_def.submit === false)) {
      submit = true;
    }

    var rows_len = table_def.rows.length;
    var cols_levels = table_def.cols.length;
    var cols_len = table_def.cols[cols_levels - 1].length;

    // Create table array
    var table = new Array(rows_len);
    for (var i = 0; i < rows_len; i++) {
      table[i] = new Array(cols_len);
    }

    // Fill in keys
    for (var j = 0; j < rows_len; j++) {
      var row_key = table_def.rows[j].key;
      for (var k = 0; k < cols_len; k++) {
        var col_key = table_def.cols[cols_levels - 1][k].key;
        table[j][k] = {row_key: row_key, col_key: col_key, row_index: j, col_index: k};
      }
    }

    // Fill in types
    table_def.types = table_def.types || [];
    for (var t = 0; t < table_def.types.length; t++) {
      var type = table_def.types[t];

      var update_cell = function (i, j) {
        if (type.type !== null) {
          table[i][j].type = type.type;
        }
        if (!type.type && !table[i][j].type) {
          table[i][j].type = 'int';
        }
        if (!table[i][j].validators || !type.validators) {
          table[i][j].validators = [];
        }

        var tmp = type.validators || [];
        for (var v = 0; v < tmp.length; v++) {
          table[i][j].validators.push(tmp[v]);
        }

        if (type.max !== undefined) {
          table[i][j].max = type.max;
        }
        if (type.min !== undefined) {
          table[i][j].min = type.min;
        }
        if (type.max_warning !== undefined) {
          table[i][j].max_warning = type.max_warning;
        }
        if (type.min_warning !== undefined) {
          table[i][j].min_warning = type.min_warning;
        }
        if (type.empty !== undefined) {
          table[i][j].empty = type.empty;
        }
        if (type.read_only !== undefined) {
          table[i][j].read_only = type.read_only;
        }
        if (type.default !== undefined) {
          table[i][j].default = type.default;
        }
        if (type.placeholder !== undefined) {
          table[i][j].placeholder = type.placeholder;
        }
      };

      visit_range(rows_len, cols_len, type.range, update_cell);
    }

    // Fill in tooltip
    table_def.tooltips = table_def.tooltips || [];
    for (t = 0; t < table_def.tooltips.length; t++) {
      var tooltip = table_def.tooltips[t];

      var update_cell2 = function (i, j) {
        table[i][j].tooltip = tooltip.tooltip;
      };

      visit_range(rows_len, cols_len, tooltip.range, update_cell2);
    }

    // Format according to HandsOnTable format.
    var rows = new Array(rows_len);
    for (i = 0; i < rows_len; i++) {
      rows[i] = table_def.rows[i].label;
    }

    var cols = table_def.cols;
    for (i = 0; i < cols_len; i++) {
      cols[cols_levels - 1][i] = table_def.cols[cols_levels - 1][i].label;
    }

    return {
      name: table_name, submit: submit,
      element: element, width: width,
      rows: rows, cols: cols, cells: table,
      rowsCount: rows_len, colsCount: cols_len,
      hot_parameters: hot_parameters
    };
  }

  /**
   * Construct a Handsontable (HOT) object corresponding to the given table object.
   * @param {object} table - the table object to create (constructed by make_table from json definition).
   * @return {hot} - the handsontable object constructed by makeHotTable.
   */
  function makeHotTable(table) {
    var element = document.querySelector('#' + table.element);

    var hot_cols = new Array(table.colsCount);
    for (var i = 0; i < table.colsCount; i++) {
      hot_cols[i] = {type: 'text'}; //default thing that does not matter, will be overridden cell by cell
    }

    var cells = [];
    // construct cell by cell properties
    for (i = 0; i < table.rowsCount; i++) {
      for (var j = 0; j < table.colsCount; j++) {
        var cell_def = table.cells[i][j];
        var type = cell_def.type;
        var empty = true;
        var read_only = false;
        var placeholder = null;

        if (cell_def.empty === false) {
          empty = cell_def.empty;
        }
        if (cell_def.read_only) {
          read_only = cell_def.read_only;
        }
        if (cell_def.placeholder) {
          placeholder = cell_def.placeholder.toString();
        }

        var cell = {
          row: i, col: j, type: type,
          allowEmpty: empty, readOnly: read_only, placeholder: placeholder,
          validator: validator, renderer: renderer
        };
        if (types_map[cell_def.type]) {
          Object.assign(cell, types_map[cell_def.type]);
        }

        cells.push(cell);
      }
    }

    // Work around not rendering the entire table
    // Make enough space in data for all rows ahead of time
    var data = new Array(table.rowsCount);
    for (var r = 0; r < table.rowsCount; r++) {
      data[r] = [];
    }

    // Todo: table.width is undefined
    var hotSettings = {
      // Enable tooltips
      comments: true,
      data: data,
      // Columns types
      columns: hot_cols,
      // Sizes
      maxRows: table.rowsCount,
      maxCols: table.colsCount,
      // Row and column headers and span
      rowHeaders: table.rows,
      nestedHeaders: table.cols,
      // Styling information
      width: table.width,
      // Per cell properties
      cell: cells,
      // Workaround for handsontable undo issue for readOnly tables
      beforeChange: function (changes, source) {
        return !(this.readOnly);
      },
      afterSetDataAtCell: function (changes, source) {
        //update_width(this);
      },
      afterChange: function (row, column) {
        //update_width(this);
      }
    };

    // other parameters from config
    Object.assign(hotSettings, table.hot_parameters);

    // Create the Handsontable
    var handsOnTable = new Handsontable(element, hotSettings);
    handsOnTable._sail_meta = table;

    // Put name in the title element (if it exists)
    document.getElementById(table.element + '-name').innerHTML = table.name;

    // TODO: why is clear needed?
    // handsOnTable.clear();

    return handsOnTable;
  }

  function get_width(table) {
    var colWidths = [];

    for (var i = 0; i < table.countRenderedCols(); i++) {
      // TODO:
      colWidths.push(50);
      // colWidths.push(table.getColWidth(i));
    }

    // Need to account for column header.
    var narrowestCol = Math.min.apply(null, colWidths);
    var colSum = colWidths.reduce(function (a, b) {
      return a + b
    }, 0);
    return narrowestCol * 5 + colSum;
  }

  /**
   * Calls f on every cell in the range.
   * @param {number} rows_len - the total number of rows.
   * @param {number} cols_len - the total number of cols.
   * @param {json} range - the range (contains row and col attributes).
   * @param {function(i, j)} f - the function to be called on every cell in the range.
   */
  function visit_range(rows_len, cols_len, range, f) {
    var row_range = range.row.split('-');
    var col_range = range.col.split('-');

    for (var r = 0; r < row_range.length; r++) {
      for (var c = 0; c < col_range.length; c++) {
        var row = row_range[r].trim();
        var col = col_range[c].trim();

        if (row === '*') {
          row = '0:1:' + (rows_len - 1);
        }
        if (col === '*') {
          col = '0:1:' + (cols_len - 1);
        }
        if (row.indexOf(':') === -1) {
          row = row + ':1:' + row;
        }
        if (col.indexOf(':') === -1) {
          col = col + ':1:' + col;
        }

        row = row.split(':');
        col = col.split(':');
        if (row.length === 2) {
          row[2] = row[1];
          row[1] = 1;
        }
        if (col.length === 2) {
          col[2] = col[1];
          col[1] = 1;
        }

        row = [parseInt(row[0], 10), parseInt(row[1], 10), parseInt(row[2], 10)];
        col = [parseInt(col[0], 10), parseInt(col[1], 10), parseInt(col[2], 10)];
        for (var ri = row[0]; ri <= row[2]; ri += row[1]) {
          for (var ci = col[0]; ci <= col[2]; ci += row[1]) {
            f(ri, ci);
          }
        }
      }
    }
  }

  /**
   * Constructs an array of json table data ( see construct_data(hot) ).
   * tables with the submit attribute set to false will be ignored.
   * @param {array(hot)} table_hot_arr - an array of handsontable objects.
   * @return {array(json)} each element contains 'name' and 'data'.
   */
  function constructDataTables(table_hot_arr) {
    var result = [];
    for (var i = 0; i < table_hot_arr.length; i++) {
      var table_hot_obj = table_hot_arr[i];
      if (table_hot_obj._sail_meta.submit === false) {
        continue;
      }
      result.push({name: table_hot_obj._sail_meta.name, data: construct_data(table_hot_obj)});
    }

    return result;
  }

  /**
   * Builds a json object that contains the data in the cells.
   * The json object has the following format:
   *  { 'row_0_key' : { 'col_0_key': data(0,0), 'col_1_key': data(0,1), ...}, ... }
   * If a cell is empty (has value null or white space) and the cell has a default
   * attribute declared, the default value will be used.
   * @param {hot} table_hot_obj - the handsontable object of the table.
   * @return {json} the described object.
   */
  function construct_data(table_hot_obj) {
    var meta = table_hot_obj._sail_meta;

    var data = {};
    for (var r = 0; r < meta.rowsCount; r++) {
      for (var c = 0; c < meta.colsCount; c++) {
        var cell = meta.cells[r][c];
        var cell_data = table_hot_obj.getDataAtCell(r, c);
        if (!cell_data || cell_data.toString().trim() === '') {
          if (cell.default) {
            cell_data = cell.default;
          }
        }

        var row_key = cell.row_key;
        var col_key = cell.col_key;
        if (data[row_key] === undefined) {
          data[row_key] = {};
        }
        data[row_key][col_key] = cell_data;
      }
    }
    return data;
  }

  /**
   * Empty all cells.
   * @param {hot} table_hot_obj - the handsontable object.
   */
  // function empty_table(table_hot_obj) {
  //   table_hot_obj.clear();
  // }


  function getMetaData(key) {
    for (var table_index in table_template.tables) {
      if (table_template.tables[table_index].name === key) {
        return table_template.tables[table_index];
      }
    }
  }

  // function parseColHeaders() {
  //   var headers = [];
  //   var race_arr = table_template.tables[0].cols[0];
  //   headers.push([""].concat(race_arr));
  //   var gender_arr = table_template.tables[0].cols[1];
  //   headers[1] = [""];
  //   for (var i = 0; i < gender_arr.length; i++) {
  //     headers[1].push(gender_arr[i].label);
  //   }

  //   return headers;
  // }

  function updateTableWidth(maxWidth) {

    $('#instructions').css('width', maxWidth);
    $('#instructions').css('max-width', maxWidth);
    var documentWidth = $(window).width();
    var containerWidth = parseFloat($('.container').first().width());
    var offset = (containerWidth - maxWidth) / 2;

    if (offset < (containerWidth - documentWidth) / 2) {
      offset = (containerWidth - documentWidth) / 2;
    }

    if (maxWidth > documentWidth) {
      $('header, #shadow').css('right', documentWidth - maxWidth);
    }

    // Bootstrap row has margin-left: -15px, add this back to offset to keep card centered
    $('#instructions').css('margin-left', offset + 15);
  }

  function resetTableWidth() {

    var $instructions = $('#instructions');
    $instructions.css('width', '');
    $instructions.css('max-width', '');
    $instructions.css('margin-left', '');
    $('header, #shadow').css('right', 0);
  }

  function displayReadTable(tables) {

    $('#tables-area').show();

    for (var t in tables) {
      var meta = getMetaData(t);
      var container = document.querySelector('#' + meta.element);

      var headers = populateTableHeaders();

      var settings = {
        colHeaders: headers,
        data: tables[t],
        readOnly: true
      }
      var handsOn = new Handsontable(container, settings);
      handsOn.render();
      $('#' + meta.element + '-name').text(t);

    }
    updateTableWidth($('.wtHider').width() + 50);
    $('.ht_clone_top').hide();
  }

  /**
   * Remove all validators from the table, keeping only the built-in
   *  validators of Handsontable.
   * @param {hot} table_hot_obj - the handsontable object.
   */
  function removeValidators(table_hot_obj) {
    var meta_table = table_hot_obj._sail_meta;
    for (var r = 0; r < meta_table.rowsCount; r++) {
      for (var c = 0; c < meta_table.colsCount; c++) {
        meta_table.cells[r][c].validators = [];
        meta_table.cells[r][c].max = null;
        meta_table.cells[r][c].min = null;
      }
    }

    table_hot_obj.render();
  }

  /**
   * Fills in the given table with the given data.
   * @param {json} data - an object of nested objects (like 2D arrays) where
   the first key is the row key, and the second is the column key.
   * @param {hot} table_hot - the handsontable object.
   */

  // function format_table(data) {

  // }


  function createMetaMap() {
    var meta_table = table_template.tables[0];

    var meta_map = {};

    for (var i = 0; i < meta_table.rows.length; i++) {
      var row_key = meta_table.rows[i].key
      meta_map[row_key] = {};

      var cols = meta_table.cols[1];
      for (var j = 0; j < cols.length; j++) {
        var col_key = cols[j].key;
        meta_map[row_key][col_key] = [i, j];
      }
    }
    return meta_map;
  }


  function fillData(data, table_hot) {
    var table = [];
    var meta_map = createMetaMap();

    // initialize 2d array
    for (var i = 0; i < Object.keys(data).length; i++) {
      table[i] = [];
    }

    // fill table
    for (var row in data) {
      for (var col in data[row]) {
        var index = meta_map[row][col];
        table[index[0]][index[1]] = data[row][col];
      }
    }

    return table;
  }

  // TODO: make this generic
  function populateTableHeaders() {
    var col_map = table_template.tables[0].cols;
    var demo_row = [''];

    for (var i = 0; i < col_map[1].length; i++) {
      var race_index = Math.floor(i / 2);
      var gender_label = col_map[1][i].label;
      var race_label = col_map[0][race_index].label;
      var label = race_label + ' ' + gender_label;
      label = label.replace('<br> ', '');
      demo_row.push(label);
    }
    return demo_row;
  }

  // TODO: should this be here or in the view?
  function saveTables(tables, session) {

    var tables_csv = [];
    var row_map = table_template.tables[0].rows;

    for (var sheet in tables) {
      var sheet_csv = [];
      sheet_csv.push([sheet]);
      sheet_csv.push(populateTableHeaders());

      for (var row in tables[sheet]) {
        var row_arr = tables[sheet][row];
        // add occupation labels
        row_arr.unshift((row_map[row].label).replace('<br> ', ''));
        row_arr = row_arr.join(',');
        sheet_csv.push(row_arr);
      }
      tables_csv = tables_csv.reverse();
      tables_csv.push(sheet_csv.join('\n'));

    }

    tables_csv = tables_csv.join('\n\n\n');
    filesaver.saveAs(new Blob([tables_csv], {type: 'text/plain;charset=utf-8'}), 'Aggregate_Data_' + session + '.csv');
  }

  function saveQuestions(questions, session) {
    if (questions.length === 0) {
      return;
    }

    var headers = [];
    for (var key in questions[0]) {
      if (questions[0].hasOwnProperty(key)) {
        headers.push(key);
      }
    }

    var results = [headers.join(',')];
    for (var i = 0; i < questions.length; i++) {
      var one_submission = [];
      for (var j = 0; j < headers.length; j++) {
        var q = headers[j];
        var answers = questions[i][q];

        var answer = '';
        for (var option in answers) {
          if (answers.hasOwnProperty(option)) {
            if (parseInt(answers[option]) === 1) {
              answer = option;
              break;
            }
          }
        }

        one_submission.push(answer);
      }
      results.push(one_submission.join(','));
    }

    results = results.join('\n');
    filesaver.saveAs(new Blob([results], {type: 'text/plain;charset=utf-8'}), 'Questions_' + session + '.csv');
  }

  return {
    makeTables: makeTables,
    registerValidator: registerValidator,
    registerErrorHandler: registerErrorHandler,
    removeValidator: removeValidator,
    removeValidators: removeValidators,
    removeErrorHandler: removeErrorHandler,
    constructDataTables: constructDataTables,
    fillData: fillData,
    saveTables: saveTables,
    saveQuestions: saveQuestions,
    displayReadTable: displayReadTable,
    resetTableWidth: resetTableWidth,
    updateTableWidth: updateTableWidth
  }
});
