// Default width of a table (in pixels). 
var HOT_DEFAULT_WIDTH = 1400;

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
  'dummy_template': function(table, cell, value, callback) { callback(true); }
};

// Registers a validator function with a name for use in the json template.
// May be called before or after template is parsed or the table is created.
function register_validator(name, validator) {
  validators_map[name] = validator;
}

// A Map from names to complex handsontable types.
// The names can be used in the json template as a shortcut to assign
// the mapped type information and formatting to a cell.
var types_map = {
  'int': {
    'type': 'numeric'
  },
  
  'currency': {
    'type': 'numeric',
    'format': '$0,0.00',
    'language': 'en-US' // this is the default locale, set up for USD
  }
}

// Registers a type (an object with attributes matching HOT format) for use in the json template.
// This must be called BEFORE the template is parsed.
function register_type(name, type) {
  types_map[name] = type;
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
var validator = function(value, callback) {
  var table = this.instance;
  var cell = table._sail_meta.cells[this.row][this.col];
  
  // Makes initializing the table faster.
  // Dont validate empty on intialization cells until they receive values.
  if(cell.first_time == undefined) { cell.first_time = true; callback(true); return; }
  
  if(value != '' && value != null && cell.max != null && value > cell.max) { callback(false); return; }
  if(value != '' && value != null && cell.min != null && value < cell.min) { callback(false); return; }
  
  // Create and call the generic_validator
  // The generic validator is setup such that
  // all validators will be executed one after the other
  // such that the callback passed to every validator is
  // chained into the next one.
  var _ = function generic_validator(value, callback, k) {
    if(k >= cell.validators.length) { callback(true); return; }
  
    var generic_callback = function(previous_result) {
      if(previous_result) generic_validator(value, callback, k+1);
      else callback(false); // early break
    }
    
    if(k > -1) {
      var validator_func = validators_map[cell.validators[k]];
      if(validator_func != null) validator_func(table, cell, value, generic_callback); 
      else generic_callback(true);
      return;
    }
    
    // call the default validator
    var hot_cell_type = cell.type;
    if(types_map[cell.type] != null && types_map[cell.type].type != null) hot_cell_type = types_map[cell.type].type;
    
    var hot_type_alias = Handsontable.cellTypes[hot_cell_type];
    if(hot_type_alias != null && hot_type_alias.validator != null 
      // Fix: if empty values are allowed, and the value is empty do not call default validator.
      && (cell.empty === false || (value != null && value != '')))
      hot_type_alias.validator(value, generic_callback);
      
    else // no default validator
      generic_callback(true);
  }(value, callback, -1);
}

/**
 * Custom renderer.
 * The header (parameters) is specified by HOT.
 * This renderer is created to display the appropriate tooltip.
 * If the cell was invalidated then an error tooltip is shown, otherwise the prompt tooltip is shown.
 * Then the default renderer that matches the declared cell type is called.
 */
var renderer = function(instance, TD, row, col, prop, value, cellProperties) {
  if(instance._sail_meta == null) return; // render will be called again
  
  var cell = instance._sail_meta.cells[row][col];
  
  // Readonly
  if(cell.read_only != null) cellProperties.readOnly = cell.read_only;

    // Tooltip
    var tooltip = cell.tooltip;
    var tableName = instance._sail_meta.element;   // Assumes each table has distinct name.

    // Use qtip2 tooltips by default.
    if(tooltip != null && (typeof jQuery !== 'undefined' && typeof jQuery().qtip !== 'undefined')) {
        var idName = tableName + row + "-" + col;

        var element = $('#' + idName);

        if (cellProperties.valid === false) {
            // Error message with red-colored cell and tooltip.
            TD.style.background = '#F06D65';
            TD.setAttribute('title', " ");
            TD.setAttribute('id', idName);
            if (tooltip.errorTitle != null) {
                 element.qtip({
                  style: {
                             classes: 'qtip-red'
                        },
                   content: {
                            title: tooltip.errorTitle,
                            text: "<img src='style/cancel.png' alt='Error'>" + tooltip.error
                        },
                   show: {
                            solo: true,
                            event: 'click',
                            delay: 30
                      },
                   hide: {
                           event: 'click',
                          delay: 10
                        }    
                });

            } else {

              element.qtip({
                  style: {
                             classes: 'qtip-red'
                        },
                   content: {
                            text: "<img src='style/cancel.png' alt='Error'>" + tooltip.error
                        },
                   show: {
                            solo: true,
                            event: 'click',
                            delay: 30
                      },
                   hide: {
                          event: 'click',
                          delay: 10
                        }
                });
          }
            // If tooltip already initialized.
            if (element !== null && element.qtip('api') !== null) {
                if (tooltip.errorTitle !== null) {
                    element.qtip('api').set('content.title', tooltip.errorTitle);
                }

                element.qtip('api').set('content.text', "<img src='style/cancel.png' alt='Error'>" + tooltip.error);
            
          }

        } //else {
        //     // Prompt message with light-colored cell and tooltip.
        //     // Shows on initial table load and
        //     TD.style.background = '#ffffff';
        //     TD.setAttribute('title', " ");
        //     TD.setAttribute('id', idName);

        //     if (tooltip.promptTitle != null) {
        //         element.qtip({
        //           style: {
        //                     classes: 'qtip-light'
        //                 },
        //            content: {
        //                     title: tooltip.promptTitle,
        //                     text: tooltip.prompt
        //                 },
        //            show: {
        //                     solo: true,
        //                     event: 'click',
        //                     delay: 30
        //               },
        //            hide: {
        //                  event: 'click',
        //                   delay: 10
        //                 }     
        //         });

        //     } else {
        //         element.qtip({
        //           style: {
        //                     classes: 'qtip-light'
        //                 },
        //            content: {
        //                     text: tooltip.prompt
        //                 },
        //            show: {
        //                     solo: true,
        //                     event: 'click',
        //                     delay: 30
        //               },
        //            hide: {
        //                   event: 'click',
        //                   delay: 10
        //                 }   
        //         });
             
        //     }

        //     // If tooltip already initialized.
        //     if (element !== null && element.qtip('api') !== null) {
        //         if (tooltip.promptTitle !== null) {
        //             element.qtip('api').set('content.title', tooltip.promptTitle);
        //         }

        //         element.qtip('api').set('content.text', tooltip.prompt);
        //     }


        //}

      
    }

     // Fallback if no jQuery - use comments.
    if (tooltip !== undefined && tooltip !== null && (typeof jQuery === 'undefined' || typeof jQuery().qtip === 'undefined')) {
      if(cellProperties.valid === false) cellProperties.comment = { "value": tooltip.errorTitle.toUpperCase() + ' - ' + tooltip.error };
      //else cellProperties.comment = { "value": tooltip.promptTitle.toUpperCase() + ' - ' + tooltip.prompt };
    }
  
  // Call the default renderer
  var baseRenderer = Handsontable.cellTypes['text'].renderer;
  var hot_cell_type = cell.type;
  if(types_map[cell.type] != null && types_map[cell.type].type != null) hot_cell_type = types_map[cell.type].type;
    
  var hot_type_alias = Handsontable.cellTypes[hot_cell_type];
  if(hot_type_alias != null && hot_type_alias.renderer != null)
    baseRenderer = hot_type_alias.renderer;
    
  baseRenderer.apply(this, arguments); // call default renderer that matches the type.
}

/**
 * Creates hands-on-tables from the given definition.
 * @param {json} tables_def - the json object representing the tables.
 * @return {array} containing HOT tables (table_obj may be accesed using hot_table._sail_meta).
 */
function make_tables(tables_def) {
  var result = [];
  for(var t = 0; t < tables_def.tables.length; t++) {
    var table_def = tables_def.tables[t];
    var table = make_table_obj(table_def);    
    result[t] = make_hot_table(table);
  }
  
  return result;
}

/**
 * Creates a hands-on-table from the given definition.
 * @param {json} table_def - the json object representing the table.
 * @return {object} an object representing the table
 */
function make_table_obj(table_def) {
  var table_name = table_def.name;
  var element = table_def.element;
  var width = table_def.width || HOT_DEFAULT_WIDTH;
  var submit = table_def.submit;
  
  if(!(table_def.submit === true || table_def.submit === false))
    submit = true;
  
  var rows_len = table_def.rows.length;
  var cols_levels = table_def.cols.length;
  var cols_len = table_def.cols[cols_levels-1].length;
  
  // Create table array
  var table = new Array(rows_len);
  for(var i = 0; i < rows_len; i++) table[i] = new Array(cols_len);
  
  // Fill in keys
  for(var i = 0; i < rows_len; i++) {
    var row_key = table_def.rows[i].key;
    for(var j = 0; j < cols_len; j++) {
      var col_key = table_def.cols[cols_levels-1][j].key;
      table[i][j] = { "row_key": row_key, "col_key": col_key, "row_index": i, "col_index": j };
    }
  }
    
  // Fill in types
  table_def.types = table_def.types || [];
  for(var t = 0; t < table_def.types.length; t++) {
    var type = table_def.types[t];

    var update_cell = function(i, j) {
      if(type.type != null) table[i][j].type = type.type;
      if(type.type == null && table[i][j].type == null) table[i][j].type = 'int';
      if(table[i][j].validators == null || type.validators === null)
        table[i][j].validators = [];
      
      var tmp = type.validators || [];
      for(var v = 0; v < tmp.length; v++) table[i][j].validators.push(tmp[v]);
      
      if(type.max !== undefined) table[i][j].max = type.max;
      if(type.min !== undefined) table[i][j].min = type.min;
      if(type.empty !== undefined) table[i][j].empty = type.empty;
      if(type.read_only !== undefined) table[i][j].read_only = type.read_only;
      if(type.default !== undefined) table[i][j].default = type.default;
      if(type.placeholder !== undefined) table[i][j].placeholder = type.placeholder;
    };
    
    visit_range(rows_len, cols_len, type.range, update_cell);  
  }
  
  // Fill in tooltip
  table_def.tooltips = table_def.tooltips || [];
  for(var t = 0; t < table_def.tooltips.length; t++) {
    var tooltip = table_def.tooltips[t];

    var update_cell = function(i, j) {
      table[i][j].tooltip = tooltip.tooltip;
    };
    
    visit_range(rows_len, cols_len, tooltip.range, update_cell);  
  }
  
  // Format according to HandsOnTable format.
  var rows = new Array(rows_len);
  for(var i = 0; i < rows_len; i++) rows[i] = table_def.rows[i].label;
  
  var cols = table_def.cols;
  for(var i = 0; i < cols_len; i++) cols[cols_levels-1][i] = table_def.cols[cols_levels-1][i].label;
  
  return {
    "name": table_name, "submit": submit, 
    "element": element, "width": width, 
    "rows": rows, "cols": cols, "cells": table,
    "rowsCount": rows_len, "colsCount": cols_len
  };
}

/**
 * Construct a Handsontable (HOT) object corresponding to the given table object.
 * @param {object} table - the table object to create (constructed by make_table from json definition).
 * @return {hot} - the handsontable object constructed by make_hot_table.
 */
function make_hot_table(table) {  
  var element = document.querySelector("#"+table.element);
  
  var hot_cols = new Array(table.colsCount);
  for(var i = 0; i < table.colsCount; i++)
    hot_cols[i] = { "type": "text" }; //default thing that does not matter, will be overriden cell by cell
    
  var cells = [];
  // construct cell by cell properties
  for(var i = 0; i < table.rowsCount; i++) {
    for(var j = 0; j < table.colsCount; j++) {
      var cell_def = table.cells[i][j];
      var type = cell_def.type;
      var empty = true;
      var read_only = false;
      var placeholder = '';
      
      if(cell_def.empty != null) empty = cell_def.empty;
      if(cell_def.read_only != null) read_only = cell_def.read_only;
      if(cell_def.placeholder != null) placeholder = cell_def.placeholder.toString();
      
      var cell = { 
        "row": i, "col": j, "type": type, 
        "allowEmpty": empty, "readOnly": read_only, 'placeholder': placeholder,
        "validator": validator, "renderer": renderer };
      if(types_map[cell_def.type]) Object.assign(cell, types_map[cell_def.type]);
      
      cells.push(cell);
    }
  }
  
  // Work around not rendering the entire table
  // Make enough space in data for all rows ahead of time
  var data = new Array(table.rowsCount);
  for(var r = 0; r < table.rowsCount; r++)
    data[r] = [];

  var hotSettings = {
    // Enable tooltips
    comments: true,
    data: data,
    // Table width in pixels
    width: table.width,
    // Columns types
    columns: hot_cols,
    // Sizes
    maxRows: table.rowsCount,
    maxCols: table.colsCount,
    // Row and column headers and span
    rowHeaders: table.rows,
    nestedHeaders: table.cols,
    // Per cell properties
    cell: cells,
    // Workaround for handsontable undo issue for readOnly tables
    beforeChange: function (changes, source) { return !(this.readOnly); }
  };
  
  // Create the Handsontable
  var handsOnTable = new Handsontable(element, hotSettings);
  handsOnTable._sail_meta = table;
  
  // Put name in the title element (if it exists)
  document.getElementById(table.element + "-name").innerHTML = table.name;
  handsOnTable.clear();
  
  return handsOnTable;
}

/**
 * Calls f on every cell in the range.
 * @param {number} rows_len - the total number of rows.
 * @param {number} cols_len - the total number of cols.
 * @param {json} range - the range (contains row and col attributes).
 * @param {function(i, j)} f - the function to be called on every cell in the range.
 */
function visit_range(rows_len, cols_len, range, f) {
  var row_range = range.row.split("-");
  var col_range = range.col.split("-");
  
  for(var r = 0; r < row_range.length; r++) {
    for(var c = 0; c < col_range.length; c++) {
      var row = row_range[r].trim();
      var col = col_range[c].trim();
      
      if(row == "*") row = "0:1:" + (rows_len-1);
      if(col == "*") col = "0:1:" + (cols_len-1);
      if(row.indexOf(":") == -1) row = row + ":1:" + row;
      if(col.indexOf(":") == -1) col = col + ":1:" + col;
      
      row = row.split(":"); col = col.split(":");
      if(row.length == 2) { row[2] = row[1]; row[1] = 1; }
      if(col.length == 2) { col[2] = col[1]; col[1] = 1; }
      
      row = [ parseInt(row[0], 10), parseInt(row[1], 10), parseInt(row[2], 10)];
      col = [ parseInt(col[0], 10), parseInt(col[1], 10), parseInt(col[2], 10)];
      for(var ri = row[0]; ri <= row[2]; ri+=row[1]) {
        for(var ci = col[0]; ci <= col[2]; ci+=row[1]) {
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
function construct_data_tables(table_hot_arr) {
  var result = [];
  for(var i = 0; i < table_hot_arr.length; i++) {
    var table_hot_obj = table_hot_arr[i];
    if(table_hot_obj._sail_meta.submit === false) continue;
    result.push( { 'name': table_hot_obj._sail_meta.name, 'data': construct_data(table_hot_obj) } );
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
  for(var r = 0; r < meta.rowsCount; r++) {
    for(var c = 0; c < meta.colsCount; c++) {
      var cell = meta.cells[r][c];
      var cell_data = table_hot_obj.getDataAtCell(r, c);
      if(cell_data == null || cell_data.toString().trim() == '')
        if(cell.default != null) cell_data = cell.default;
      
      var row_key = cell.row_key;
      var col_key = cell.col_key;
      if(data[row_key] == undefined) data[row_key] = {};
      data[row_key][col_key] = cell_data;
    }
  }
  return data;
}

/**
 * Empty all cells.
 * @param {hot} table_hot_obj - the handsontable object.
 */
function empty_table(table_hot_obj) {
  table_hot_obj.clear();
}

/**
 * Change the read only attribute of the entire table.
 * @param {hot} table_hot_obj - the handsontable object.
 * @param {boolean} read_only - the new value.
 */
function read_only_table(table_hot_obj, read_only) {
  var meta_table = table_hot_obj._sail_meta;
  for(var r = 0; r < meta_table.rowsCount; r++) {
    for(var c = 0; c < meta_table.colsCount; c++) {
      meta_table.cells[r][c].read_only = read_only;
    }
  }
  
  table_hot_obj.render();
}

/**
 * Remove all validators from the table, keeping only the built-in
 *  validators of Handsontable.
 * @param {hot} table_hot_obj - the handsontable object.
 */
function remove_validators(table_hot_obj) {
  var meta_table = table_hot_obj._sail_meta;
  for(var r = 0; r < meta_table.rowsCount; r++) {
    for(var c = 0; c < meta_table.colsCount; c++) {
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
function fill_data(data, table_hot) {
  var table_meta = table_hot._sail_meta;
  
  var data_array = new Array(table_meta.rowsCount);
  for(var r = 0; r < table_meta.rowsCount; r++) {
    data_array[r] = new Array(table_meta.colsCount);
    for(var c = 0; c < table_meta.colsCount; c++) {
      var cell = table_meta.cells[r][c];
      var row_key = cell.row_key;
      var col_key = cell.col_key;
      
      data_array[r][c] = data[row_key][col_key];
    }
  }
  
  table_hot.loadData(data_array); 
}




