var HOT_DEFAULT_WIDTH = 1024;

var validators_map = {
    'validate1': function (value, callback) {
        console.log("validator1");
        callback(true);
    },
    'validate2': function (value, callback) {
        console.log(value);
        callback(true);
    }
};

function register_validator(name, validator) {
    validators_map[name] = validator;
}

var types_map = {
    'int': {
        'type': 'numeric'
    },

    'readOnly': {
        'type': 'text',
        'readOnly': true
    },

    'currency': {
        'type': 'numeric',
        'format': '$0,0.00',
        'language': 'en-US' // this is the default locale, set up for USD
    }
}

function register_type(name, type) {
    types_map[name] = validator;
}

var validator = function (value, callback) {
    var cell = this.instance.__sail_meta.cells[this.row][this.col];
    if (cell.max != null && value > cell.max) {
        callback(false);
        return;
    }
    if (cell.min != null && value < cell.min) {
        callback(false);
        return;
    }

    // Create and call the generic_validator
    // The generic validator is setup such that
    // all validators will be executed one after the other
    // such that the callback passed to every validator is
    // chained into the next one.
    var _ = function generic_validator(value, callback, k) {
        if (k >= cell.validators.length) {
            callback(true);
            return;
        }

        var generic_callback = function (previous_result) {
            if (previous_result) generic_validator(value, callback, k + 1);
            else callback(false); // early break
        }

        if (k > -1) {
            cell.validators[k](value, generic_callback);
            return;
        }

        // call the default validator
        var hot_cell_type = cell.type;
        if (types_map[cell.type] != null && types_map[cell.type].type != null) hot_cell_type = types_map[cell.type].type;

        var hot_type_alias = Handsontable.cellTypes[hot_cell_type];
        if (hot_type_alias != null && hot_type_alias.validator != null)
            hot_type_alias.validator(value, generic_callback);

        else // no default validator
            generic_callback(true);
    }(value, callback, -1);
}

var renderer = function (instance, TD, row, col, prop, value, cellProperties) {
    if (instance.__sail_meta == null) return; // render will be called again

    // show tooltip if
    var cell = instance.__sail_meta.cells[row][col];
    var tooltip = cell.tooltip;

    if (tooltip != null) {
        var idName = "table-" + row + "-" + col;
        var element = $('#' + idName);

        if (!cellProperties.valid) {
            // error message
            TD.style.background = '#f78b83';
            TD.setAttribute('title', " ");
            TD.setAttribute('id', idName);
            if (tooltip.errorTitle != null) {
                element.qtip(
                    {
                        style: {
                            classes: 'qtip-red'
                        }
                    },
                    {
                        content: {
                            title: tooltip.errorTitle,
                            text: tooltip.error
                        }
                    }
                );
            } else {
                element.qtip(
                    {
                        style: {
                            classes: 'qtip-red'
                        }
                    },
                    {
                        content: {
                            text: tooltip.error
                        }
                    }
                );
            }


            if (element !== null && element.qtip('api') !== null) {
                if (tooltip.errorTitle !== null) {
                    element.qtip('api').set('content.title', tooltip.errorTitle);
                }

                element.qtip('api').set('content.text', tooltip.error);
            }

        } else {
            // prompt messages
            TD.style.background = '#f3f3f3';
            TD.setAttribute('title', " ");
            TD.setAttribute('id', idName);

            if (tooltip.promptTitle != null) {
                element.qtip(
                    {
                        style: {
                            classes: 'qtip-light'
                        }
                    },
                    {
                        content: {
                            title: tooltip.promptTitle,
                            text: tooltip.prompt
                        }
                    }
                );
            } else {
                element.qtip(
                    {
                        style: {
                            classes: 'qtip-light'
                        }
                    },
                    {
                        content: {
                            text: tooltip.prompt
                        }
                    }
                );
            }


            if (element !== null && element.qtip('api') !== null) {
                if (tooltip.promptTitle !== null) {
                    element.qtip('api').set('content.title', tooltip.promptTitle);
                }

                element.qtip('api').set('content.text', tooltip.prompt);
            }

        }
    }

// call the default renderer
    var baseRenderer = Handsontable.cellTypes['text'].renderer;
    var hot_cell_type = cell.type;
    if (types_map[cell.type] != null && types_map[cell.type].type != null) hot_cell_type = types_map[cell.type].type;

    var hot_type_alias = Handsontable.cellTypes[hot_cell_type];
    if (hot_type_alias != null && hot_type_alias.renderer != null)
        baseRenderer = hot_type_alias.renderer;

    baseRenderer.apply(this, arguments);
}

/**
 * Creates hands-on-tables from the given definition.
 * @param {json} tables_def - the json object representing the tables.
 * @return {array} containing HOT tables (table_obj may be accesed using hot_table.__sail_meta).
 */
function make_tables(tables_def) {
    var result = [];
    for (var t = 0; t < tables_def.tables.length; t++) {
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

    var rows_len = table_def.rows.length;
    var cols_levels = table_def.cols.length;
    var cols_len = table_def.cols[cols_levels - 1].length;

    // Create table array
    var table = new Array(rows_len);
    for (var i = 0; i < rows_len; i++) table[i] = new Array(cols_len);

    // Fill in keys
    for (var i = 0; i < rows_len; i++) {
        var row_key = table_def.rows[i].key;
        for (var j = 0; j < cols_len; j++) {
            var col_key = table_def.cols[cols_levels - 1][j].key;
            table[i][j] = {"key": table_name + "_" + row_key + "_" + col_key};
        }
    }

    // Fill in types
    table_def.types = table_def.types || [];
    for (var t = 0; t < table_def.types.length; t++) {
        var type = table_def.types[t];

        var update_cell = function (i, j) {
            table[i][j].type = type.type;
            if (table[i][j].validators == null || type.validators === null)
                table[i][j].validators = [];

            var tmp = type.validators || [];
            for (var v = 0; v < tmp.length; v++) table[i][j].validators.push(validators_map[tmp[v]]);

            if (type.max !== undefined) table[i][j].max = type.max;
            if (type.min !== undefined) table[i][j].min = type.min;
            if (type.empty !== undefined) table[i][j].empty = type.empty;
        };

        visit_range(rows_len, cols_len, type.range, update_cell);
    }

    // Fill in tooltip
    table_def.tooltips = table_def.tooltips || [];
    for (var t = 0; t < table_def.tooltips.length; t++) {
        var tooltip = table_def.tooltips[t];

        var update_cell = function (i, j) {
            table[i][j].tooltip = tooltip.tooltip;
        };

        visit_range(rows_len, cols_len, tooltip.range, update_cell);
    }

    // Format according to HandsOnTable format.
    var rows = new Array(rows_len);
    for (var i = 0; i < rows_len; i++) rows[i] = table_def.rows[i].label;

    var cols = table_def.cols;
    for (var i = 0; i < cols_len; i++) cols[cols_levels - 1][i] = table_def.cols[cols_levels - 1][i].label;

    return {
        "name": table_name, "element": "#" + element, "width": width,
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
    var element = document.querySelector(table.element);

    var hot_cols = new Array(table.colsCount);
    for (var i = 0; i < table.colsCount; i++)
        hot_cols[i] = {"type": "text"}; //default thing that does not matter, will be overriden cell by cell

    var cells = [];
    // construct cell by cell properties
    for (var i = 0; i < table.rowsCount; i++) {
        for (var j = 0; j < table.colsCount; j++) {
            var cell_def = table.cells[i][j];
            var type = cell_def.type;
            var empty = true;

            if (cell_def.empty != null) empty = cell_def.empty;

            var cell = {
                "row": i,
                "col": j,
                "type": type,
                "allowEmpty": empty,
                "validator": validator,
                "renderer": renderer
            };
            if (types_map[cell_def.type]) Object.assign(cell, types_map[cell_def.type]);
            cells.push(cell);
        }
    }

    var hotSettings = {
        // Enable tooltips
        comments: true,
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
        beforeChange: function (changes, source) {
            return !(this.readOnly);
        }
    };

    // Create the Handsontable
    var handsOnTable = new Handsontable(element, hotSettings);
    handsOnTable.__sail_meta = table;
    handsOnTable.render();

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

    for (var r = 0; r < row_range.length; r++) {
        for (var c = 0; c < col_range.length; c++) {
            var row = row_range[r].trim();
            var col = col_range[c].trim();

            if (row == "*") row = "0:1:" + (rows_len - 1);
            if (col == "*") col = "0:1:" + (cols_len - 1);
            if (row.indexOf(":") == -1) row = row + ":1:" + row;
            if (col.indexOf(":") == -1) col = col + ":1:" + col;

            row = row.split(":");
            col = col.split(":");
            if (row.length == 2) {
                row[2] = row[1];
                row[1] = 1;
            }
            if (col.length == 2) {
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
