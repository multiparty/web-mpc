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
              opts.on.workend(processWB(wb));
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

    // Process individual sheet.
    function processWS(ws, table, start, end) {

      let s = XLSX.utils.decode_cell(start);
      let e = XLSX.utils.decode_cell(end);

      for (let i = s.r; i <= e.r; i++) {
        for (let j = s.c; j <= e.c; j++) {
          var cell = XLSX.utils.encode_cell({r: i, c: j});
          if (ws[cell] && !isNaN(ws[cell].v)) {
            // subtract initial offset
            table.setDataAtCell(i-s.r, j-s.c, ws[cell].v);
          } else {
            alertify.alert("<img src='/images/cancel.png' alt='Error'>Error!", "Spreadsheet format does not match original template, or there are empty cells, or non-numeric data. Please copy-and-paste or type data into the 'Number Of Employees' table manually.");
            return false;
          }
        }
      }
      return true;
    }

    // Parses workbook for relevant cells.
    function processWB(wb) {
      var tableDef = opts.tables_def.tables;

      for (const name of wb.SheetNames) {
        let tableId = 0;
        for (const table of tableDef) {
          if (table.excel && table.excel[0] && table.excel[0].sheet === name) {
            if (!processWS(wb.Sheets[name], opts.tables[tableId], table.excel[0].start, table.excel[0].end)) {
              return false; // mistake in processing sheet
            }
          }
          tableId++;
        }
      }

      alertify.alert('<img src="/images/accept.png" alt="Success">Success', 'The tables below have been populated. Please confirm that your data is accurate and scroll down to answer the multiple choice questions, verify, and submit your data');

      return true;
    }


    // For drag-and-drop.

    function handleDrop(e) {

      if (typeof jQuery !== 'undefined') {
        e.stopPropagation();
        e.preventDefault();
        if (pending) {
          return opts.errors.pending();
        }
        $('#drop-area').removeClass('dragenter');

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
