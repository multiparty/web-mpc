/* global XLSX, XLS */
define(['alertify', 'alertify_defaults', 'XLSX'], function (alertify) {

  var DropSheet = function DropSheet(opts) {
    if (!opts) {
      opts = {};
    }
    var nullfunc = function () {
    };
    if (!opts.errors) {
      opts.errors = {};
    }
    if (!opts.handle_file) {
      opts.handle_file = handleFile;
    }
    if (!opts.errors.badfile) {
      opts.errors.badfile = nullfunc;
    }
    if (!opts.errors.pending) {
      opts.errors.pending = nullfunc;
    }
    if (!opts.errors.failed) {
      opts.errors.failed = nullfunc;
    }
    if (!opts.errors.large) {
      opts.errors.large = nullfunc;
    }
    if (!opts.on) {
      opts.on = {};
    }
    if (!opts.on.workstart) {
      opts.on.workstart = nullfunc;
    }
    if (!opts.on.workend) {
      opts.on.workend = nullfunc;
    }
    if (!opts.on.sheet) {
      opts.on.sheet = nullfunc;
    }
    if (!opts.on.wb) {
      opts.on.wb = nullfunc;
    }

    var rABS = typeof FileReader !== 'undefined' && typeof FileReader.prototype !== 'undefined' && typeof FileReader.prototype.readAsBinaryString !== 'undefined';
    // var useworker = typeof Worker !== 'undefined';
    var pending = false;

    // Various functions for reading in, parsing.
    function readFile(files) {

      var i, f;
      for (i = 0; i !== files.length; ++i) {
        f = files[i];
        var reader = new FileReader();

        reader.onload = function (e) {
          var data = e.target.result;

          var wb, arr = false;
          var readtype = {type: rABS ? 'binary' : 'base64'};
          if (!rABS) {
            arr = fixData(data);
            data = btoa(arr);
          }

          function doit() {
            try {
              opts.on.workstart();

              wb = XLSX.read(data, readtype);
              opts.on.workend(processWB(wb, 'XLSX'));
            } catch (e) {
              opts.errors.failed(e);
            }
          }

          if (e.target.result.length > 500000) {
            opts.errors.large(e.target.result.length, function (e) {
              if (e) {
                doit();
              }
            });
          } else {
            doit();
          }
        };
        if (rABS) {
          reader.readAsBinaryString(f);
        } else {
          reader.readAsArrayBuffer(f);
        }
      }
    }

    // Helper method for array buffer read-in.
    function fixData(data) {
      var o = '', l = 0, w = 10240;
      for (; l < data.byteLength / w; ++l) {
        o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
      }
      o += String.fromCharCode.apply(null, new Uint8Array(data.slice(o.length)));
      return o;
    }


    // Parses workbook for relevant cells.
    function processWB(wb, type, sheetidx) {
      var current_sheet, tableidx;

      if (sheetidx === null) {
        // Check tab names are valid.
        for (tableidx = 0; tableidx < opts.tables_def.tables.length; tableidx++) {
          if (opts.tables_def.tables[tableidx].excel !== undefined) {
            current_sheet = opts.tables_def.tables[tableidx].excel[0].sheet;

            if (wb.SheetNames.indexOf(current_sheet) === -1) {
              // Should override anything that was in HOT originally in case of reupload.
              opts.tables[tableidx].clear();
              alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!",
                "Please make sure spreadsheet tab names match those of original template. Tab '" + current_sheet
                + "' not found.");
              return;
            }
          }
        }
      }

      // Corresponds to number of tables that are submitted.
      var checks = [];
      for (var i = 0; i < opts.tables_def.tables.length; i++) {
        if (opts.tables_def.tables[i].submit === null || opts.tables_def.tables[i].submit) {
          checks.push(false);
        }
      }

      // Loop through xlsx worksheets and tables.
      for (sheetidx = 0; sheetidx < wb.SheetNames.length; sheetidx++) {
        current_sheet = wb.Sheets[wb.SheetNames[sheetidx]];
        for (tableidx = 0; tableidx < opts.tables_def.tables.length; tableidx++) {

          if (opts.tables_def.tables[tableidx].excel !== undefined && opts.tables_def.tables[tableidx].excel !== null && opts.tables_def.tables[tableidx].excel[0] !== null) {
            if (opts.tables_def.tables[tableidx].excel[0].sheet === wb.SheetNames[sheetidx]) {
              checks[tableidx] = processWS(current_sheet, opts.tables_def.tables[tableidx], opts.tables[tableidx]);

            }
          }

        }
      }

      // Assumes all tables updated.
      if (checks.indexOf(false) === -1) {
        alertify.alert('<img src="/images/accept.png" alt="Success">Success',
          'The tables below have been populated. Please confirm that your data is accurate and scroll down to answer the multiple choice questions, verify, and submit your data');
        return true; // no errors.
      }

      return false; // There are some errors.
    }

    // Processes single XLSX JS worksheet and updates one Handsontable.
    function processWS(ws, table_def, table) {
      // console.log("WORKSHEET", ws, table_def, table);

      // Clear existing values in case user is submitting updated sheet after error.
      //table.clear();

      // Default range for input section of spreadsheet, obtained from tables.json.
      var sheet_start = table_def.excel[0].start;
      var sheet_end = table_def.excel[0].end;

      // Ranges for handsontable.
      var table_start = XLS.utils.decode_cell(sheet_start);
      var table_end = XLS.utils.decode_cell(sheet_end);
      var num_rows = table_end.r - table_start.r + 1;
      var num_cols = table_end.c - table_start.c + 1;

      var changes = [];

      // Keys of XLSX js worksheet.
      var ws_keys = Object.keys(ws);

      // Default settings for matrix boundary.
      var matrix = XLSX.utils.sheet_to_json(ws, {raw: true, range: table_start.r, header: 1});

      // console.log("MATRIX", matrix)
      // Check if default range is correct based on top row name.
      if (!(ws[XLS.utils.encode_cell({r: table_start.r, c: table_start.c - 1})] !== undefined &&
          ws[XLS.utils.encode_cell({r: table_start.r, c: table_start.c - 1})].v === table_def.excel[0].firstrow)) {


        var found_row = false;

        // If table is not in expected position, get new boundaries.
        for (var i = 0; i < ws_keys.length; i++) {
          var key = ws_keys[i];

          // Parse for location of top row name.
          if (ws[key].v !== undefined && ws[key].v !== null && table_def.excel[0].firstrow.toString() === ws[key].v.toString()) {
            // Update to boundaries of table (start, end, etc.)
            var new_start_row = Number(XLS.utils.decode_cell(key).r);
            var new_start_col = Number(XLS.utils.decode_cell(key).c) + 1;
            sheet_start = XLSX.utils.encode_cell({r: new_start_row, c: new_start_col});
            sheet_end = XLSX.utils.encode_cell({r: new_start_row + num_rows - 1, c: new_start_col + num_cols - 1});
            table_start = XLSX.utils.decode_cell(sheet_start);
            table_end = XLSX.utils.decode_cell(sheet_end);
            matrix = XLSX.utils.sheet_to_json(ws, {raw: true, range: table_start.r, header: 1});
            found_row = true;
            break;
          }
        }

        // If expected row name not found.
        if (!found_row) {
          alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!",
            "Spreadsheet format does not match original template. Please copy-and-paste or type data into the '" +
            table_def.name + "' table manually.");
          return false;
        }
      }

      // Filter array to get rid of undefined values/any headers.
      for (i = 0; i < matrix.length; i++) {
        matrix[i] = matrix[i].filter(function (cell) {
          return cell !== undefined && cell !== null && !isNaN(Number(cell));
        })
      }

      // Parsing sometimes leads to empty rows, remove these.
      for (var j = matrix.length - 1; j >= 0; j--) {
        if (matrix[j].length === 0) {
          matrix.splice(j, 1);
        }
      }


      // Check that number of expected numeric cells is correct. Otherwise alert user.
      // Row and column checks.
      if (matrix.length !== num_rows) {
        alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!",
          "Spreadsheet format does not match original template, or there are empty cells, or non-numeric data. Please copy-and-paste or type data into the '" +
          table_def.name + "' table manually.");
        return false;
      }

      for (i = 0; i < matrix.length; i++) {
        if (matrix[i].length !== num_cols) {
          alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!",
            "Spreadsheet format does not match original template, or there are empty cells, or non-numeric data. Please copy-and-paste or type data into the '" +
            table_def.name + "' table manually.");
          return false;
        }
      }

      // For each sheet, set value in handsontable.
      for (var r = 0; r < num_rows; r++) {
        for (var c = 0; c < num_cols; c++) {
          changes.push([r, c, matrix[r][c]]);
        }
      }

      if (changes.length > 0) {
        table.setDataAtCell(changes);
        return true;
      }

      alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!",
        "Spreadsheet format does not match original template, or there are empty cells, or non-numeric data. Please copy-and-paste or type data into the '" +
        table_def.name + "' table manually.");
      return false;

    }

    // For drag-and-drop.

    function handleDrop(e) {

      if (typeof jQuery !== 'undefined') {
        e.stopPropagation();
        e.preventDefault();
        if (pending) {
          return opts.errors.pending();
        }
        // var files = e.dataTransfer.files;
        $('#drop-area').removeClass('dragenter');
        // readFile(files);
        opts.handle_file(e);
      } else {
        alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", "Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
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

    function handleDragleave(e) {
      if (typeof jQuery !== 'undefined') {
        $('#drop-area').removeClass('dragenter');
      } else {
        alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", "Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
      }
    }

    function handleClick(e) {
      if (typeof jQuery !== 'undefined') {
        $('#choose-file').click();
      } else {
        alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", "Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
      }
    }

    if (opts.drop.addEventListener) {
      opts.drop.addEventListener('dragenter', handleDragover, false);
      opts.drop.addEventListener('dragleave', handleDragleave);
      opts.drop.addEventListener('dragover', handleDragover, false);
      opts.drop.addEventListener('drop', handleDrop, false);
      opts.choose.addEventListener('click', handleClick, false);
    }

    // For choosing a file using <input> (ie Choose File button).

    function handleFile(e) {
      var files;

      if (e.type === 'drop') {
        files = e.dataTransfer.files
      } else if (e.type === 'change') {
        files = e.target.files;
      }

      if (window.FileReader) {
        // FileReader is supported.
        readFile(files);
      } else {
        alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", 'FileReader is not supported in this browser.');
      }
    }

    if (opts.choose.addEventListener) {
      if (typeof jQuery !== 'undefined') {
        $('#choose-file').change(opts.handle_file);
      }
    }
  };

  return DropSheet;

});
