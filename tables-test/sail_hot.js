var HOT_DEFAULT_WIDTH = 1024;

var verifiers_map = {
  'verify1': function(value) { console.log("verifier1"); return value > 100; },
  'verify2': function(value) { console.log(value); return false; }
};

/**
 * Creates hands-on-tables from the given definition.
 * @param { json } tables_def - the json object representing the tables.
 * @param { map } elements - a map from table name to enclosing element (a div usually).
 * @return { array } an array of table objects.
 */
function make_tables(tables_def) {
  var result = [];
  for(var t = 0; t < tables_def.tables.length; t++) {
    var table_def = tables_def.tables[t];
    var table = make_table_obj(table_def);
    result[t] = table;
    
    make_hot_table(table);
  }
  
  return result;
}

/**
 * Creates a hands-on-table from the given definition.
 * @param { json } table_def - the json object representing the table.
 * @param { dom-element } element - the enclosing element (a div usually).\
 * @return { object } an object representing the table
 */
function make_table_obj(table_def) {
  var table_name = table_def.name;
  var element = table_def.element;
  var width = table_def.width || HOT_DEFAULT_WIDTH;
  
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
      table[i][j] = { "key": table_name + "_" + row_key + "_" + col_key };
    }
  }
  
  // Fill in types
  for(var t = 0; t < table_def.types.length; t++) {
    var type = table_def.types[t];

    var update_cell = function(i, j) {
      table[i][j].type = type.type;
      
      var tmp = type.verifiers || [];
      var verifiers = new Array(tmp.length);
      for(var v = 0; v < tmp.length; v++) {
        verifiers[v] = verifiers_map[tmp[v]];
      }
      
      table[i][j].verifiers = verifiers;
    };
    
    visit_range(rows_len, cols_len, type.range, update_cell);  
  }
  
  
  // Fill in tooltip
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
    "name": table_name, "element": "#"+element, "width": width, 
    "rows": rows, "cols": cols, "cells": table,
    "rowsCount": rows_len, "colsCount": cols_len
  };
}

function make_hot_table(table) {
  var element = document.querySelector(table.element);
  
  var hot_cols = new Array(table.colsCount);
  for(var i = 0; i < table.colsCount; i++)
    hot_cols[i] = { "type": "numeric" };
  
  var hotSettings = {
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
    /* 
     * Handlers for a variety of events 
     */    
    // Validate
    afterChange: function (changes, source) { },
    
    // handle if things are valid or invalid
    afterValidate: function (isValid, value, row, prop, source) { },
    
    // Workaround for handsontable undo issue
    beforeChange: function (changes, source) { return !(this.readOnly); }
  };
  
  new Handsontable(element, hotSettings);
}

function makeBlank(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);
  td.style.background = '#f3f3f3';
}

function outsideRangeRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);
  td.style.background = '#ffff00';
}

/**
 * Calls f on every cell in the range.
 * @param {number} rows_len - the total number of rows.
 * @param {number} cols_len - the total number of cols.
 * @param {json} range - the range (contains row and col attributes).
 * @param { function(i, j) } f - the function to be called on every cell in the range.
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
      
      row = [ parseInt(row[0]), parseInt(row[1]), parseInt(row[2])];
      col = [ parseInt(col[0]), parseInt(col[1]), parseInt(col[2])];
      for(var ri = row[0]; ri <= row[2]; ri+=row[1]) {
        for(var ci = col[0]; ci <= col[2]; ci+=row[1]) {
          f(ri, ci);
        }
      }
    }
  }
}
