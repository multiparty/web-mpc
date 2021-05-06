/* global XLSX, XLS */
define(['alertHandler', 'XLSX'], function (alertHandler) {

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

          if (e.target.result.length > 5000000) {
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
      var changes = [];

      var s = XLSX.utils.decode_cell(start);
      var e = XLSX.utils.decode_cell(end);

      for (var i = s.r; i <= e.r; i++) {
        for (var j = s.c; j <= e.c; j++) {
          var cell = XLSX.utils.encode_cell({r: i, c: j});
          if (ws[cell] && !isNaN(ws[cell].v)) {
            // subtract initial offset
            changes.push([i-s.r, j-s.c, ws[cell].v]);
          } else {
            alertHandler.error('Cell "' + cell + '" in sheet "' + table._sail_meta.name + '" is not valid. Please ensure the cell is not empty, or does not contain non-numeric data.');
            return false;
          }
        }
      }
      table.setDataAtCell(changes);
      return true;
    }

    /**
     * Processes the uploaded spreadsheet
     * @param {excel-workbook} wb
     * @returns void
     */
    function processWB(wb) {
      var tableDef = opts.tables_def.tables;

      if (wb.SheetNames.length < 1) {
        throw 'No spreadsheets were found.'
      }

      for (var i = 0; i < tableDef.length; i++) {
        var table = tableDef[i];
        var processed = false;
        wb.SheetNames.forEach(function (name) {
          if (table.excel && table.excel[0] && table.excel[0].sheet === name) {
            if (processWS(wb.Sheets[name], opts.tables[i], table.excel[0].start, table.excel[0].end)) {
              processed = true;
            }
          }
        });

        if (!processed) {
          throw 'Spreadsheet name does not match with format.'
        }
      }
      alertHandler.success('The tables below have been populated. Please confirm that your data is accurate and scroll down to answer the multiple choice questions, verify, and submit your data');
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
        alertHandler.error("Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
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
        alertHandler.error("Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
      }
    }

    function handleDragleave(e) {
      if (typeof jQuery !== 'undefined') {
        $('#drop-area').removeClass('dragenter');
      } else {
        alertHandler.error("Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
      }
    }

    function handleClick(e) {
      if (typeof jQuery !== 'undefined') {
        $('#choose-file').click();
      } else {
        alertHandler.error("Drag and drop not supported. Please use the 'Choose File' button or copy-and-paste data.");
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
        alertHandler.error('FileReader is not supported in this browser.');
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
