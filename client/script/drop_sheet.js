var DropSheet = function DropSheet(opts) {
    if (!opts) opts = {};
    var nullfunc = function () {
    };
    if (!opts.errors) opts.errors = {};
    if (!opts.errors.badfile) opts.errors.badfile = nullfunc;
    if (!opts.errors.pending) opts.errors.pending = nullfunc;
    if (!opts.errors.failed) opts.errors.failed = nullfunc;
    if (!opts.errors.large) opts.errors.large = nullfunc;
    if (!opts.on) opts.on = {};
    if (!opts.on.workstart) opts.on.workstart = nullfunc;
    if (!opts.on.workend) opts.on.workend = nullfunc;
    if (!opts.on.sheet) opts.on.sheet = nullfunc;
    if (!opts.on.wb) opts.on.wb = nullfunc;

    var rABS = typeof FileReader !== 'undefined' && typeof FileReader.prototype !== 'undefined' && typeof FileReader.prototype.readAsBinaryString !== 'undefined';
    var useworker = typeof Worker !== 'undefined';
    var pending = false;

    // Various functions for reading in, parsing.
    function readFile(files) {
        var i, f;
        for (i = 0; i != files.length; ++i) {
            f = files[i];
            var reader = new FileReader();
            var name = f.name;
            reader.onload = function (e) {
                var data = e.target.result;

                var wb, arr, xls = false;
                var readtype = {type: rABS ? 'binary' : 'base64'};
                if (!rABS) {
                    arr = fixdata(data);
                    data = btoa(arr);
                }
                function doit() {
                    try {
                        if (useworker) {
                            sheetjsw(data, process_wb, readtype, xls);
                            return;
                        }
                        wb = XLSX.read(data, readtype);
                        process_wb(wb, 'XLSX');
                    } catch (e) {
                        opts.errors.failed(e);
                    }
                }

                if (e.target.result.length > 500000) opts.errors.large(e.target.result.length, function (e) {
                    if (e) doit();
                });
                else {
                    doit();
                }
            };
            if (rABS) reader.readAsBinaryString(f);
            else reader.readAsArrayBuffer(f);
        }
    }

    // Helper method for array buffer read-in.
    function fixdata(data) {
        var o = "", l = 0, w = 10240;
        for (; l < data.byteLength / w; ++l)
            o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
        o += String.fromCharCode.apply(null, new Uint8Array(data.slice(o.length)));
        return o;
    }

    // Use worker.
    function sheetjsw(data, cb, readtype, xls) {
        pending = true;
        opts.on.workstart();
        var scripts = document.getElementsByTagName('script');
        var path;
        for (var i = 0; i < scripts.length; i++)
            if (scripts[i].src.indexOf('path') != -1)
                path = scripts[i].src.split('path.js')[0];
        var worker = new Worker(path + 'sheetjsw.js');
        worker.onmessage = function (e) {
            switch (e.data.t) {
                case 'ready':
                    break;
                case 'e':
                    pending = false;
                    console.error(e.data.d);
                    break;
                case 'xls':
                case 'xlsx':
                    pending = false;
                    opts.on.workend();
                    cb(JSON.parse(e.data.d), e.data.t);
                    break;
            }
        };
        worker.postMessage({d: data, b: readtype, t: 'xlsx'});
    }

    var last_wb, last_type;

    // JS XLSX sheet conversion of workbook to json format.
    function to_json(workbook, type) {
        var XL = type.toUpperCase() === 'XLS' ? XLS : XLSX;
        if (useworker && workbook.SSF) XLS.SSF.load_table(workbook.SSF);
        var result = {};
        workbook.SheetNames.forEach(function (sheetName) {
            var roa = XL.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {raw: true});
            if (roa.length > 0) result[sheetName] = roa;
        });
        return result;
    }


    // Gets column headers on sheet. Assumes it's in first row.
    function get_columns(sheet, type) {
        var val, rowObject, range, columnHeaders, emptyRow, C;
        if (!sheet['!ref']) return [];
        range = XLS.utils.decode_range(sheet["!ref"]);
        columnHeaders = [];
        for (C = range.s.c; C <= range.e.c; ++C) {
            val = sheet[XLS.utils.encode_cell({c: C, r: range.s.r})];
            if (!val) continue;
            columnHeaders[C] = type.toLowerCase() == 'xls' ? XLS.utils.format_cell(val) : val.v;
        }
        return columnHeaders;
    }

    function choose_sheet(sheetidx) {
        process_wb(last_wb, last_type, sheetidx);
    }


    // Parses workbook for relevant cells.
    function process_wb(wb, type, sheetidx) {

        if (sheetidx == null)
            // Check tab names are valid.
            for (var tableidx = 0; tableidx < opts.tables_def.tables.length; tableidx++) {
                if (opts.tables_def.tables[tableidx].excel === undefined) {
                    continue;
                } else {
                    var current_sheet = opts.tables_def.tables[tableidx].excel[0].sheet;
                    if (wb.SheetNames.indexOf(current_sheet) === -1) {
                        alertify.alert("<img src='style/cancel.png' alt='Error'>Error!",
                            "Please make sure spreadsheet tab names match those of original template. Tab '" + current_sheet
                            + "' not found.");
                        return;
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
                var current_sheet = wb.Sheets[wb.SheetNames[sheetidx]];
                //console.log(current_sheet);
                for (var tableidx = 0; tableidx < opts.tables_def.tables.length; tableidx++) {
                    if (opts.tables_def.tables[tableidx].excel === undefined) {
                        continue;
                    }
                    if (opts.tables_def.tables[tableidx].excel !== undefined && opts.tables_def.tables[tableidx].excel !== null && opts.tables_def.tables[tableidx].excel[0] !== null) {
                        if (opts.tables_def.tables[tableidx].excel[0].sheet == wb.SheetNames[sheetidx]) {
                            //console.log(current_sheet);
                            //console.log(XLSX.utils.sheet_to_json(current_sheet, {raw: true, range: 4}));
                            checks[tableidx] = process_ws(current_sheet, opts.tables_def.tables[tableidx], opts.tables[tableidx]);

                        }
                    }

                }
            }

            // Assumes all tables updated.
            if (checks.indexOf(false) === -1) {
                alertify.alert("<img src='style/accept.png' alt='Success'>Success",
                    "Updated tables with data automatically. Please fill out the rest of the page.");
            }

    }

    // Processes single XLSX JS worksheet and updates one Handsontable.
    function process_ws(ws, table_def, table) {

        // Default ranges for input section of spreadsheet from tables.json.
        var sheet_start = table_def.excel[0].start;
        var sheet_end = table_def.excel[0].end;
        var header_start = XLS.utils.decode_cell(sheet_start);

        // Ranges for handsontable.
        var table_start = XLS.utils.decode_cell(sheet_start);
        var table_end = XLS.utils.decode_cell(sheet_end);
        var num_rows = table_end.r - table_start.r + 1;
        var num_cols = table_end.c - table_start.c + 1;

        var changes = [];

        // Keys of XLSX js worksheet.
        var ws_keys = Object.keys(ws);

        // Check if default start and end are correct based on top row name.
        if (!(ws[XLS.utils.encode_cell({r: header_start.r, c: header_start.c - 1})] !== undefined &&
            ws[XLS.utils.encode_cell({r: header_start.r, c: header_start.c - 1})].v === table_def.excel[0].firstrow)){


;           var found_row = false;
            // Parse for location of top row name. Only works if extra rows/columns are inserted to left/above table.
            for (var i = 0; i < ws_keys.length; i++) {
                var key = ws_keys[i];


                if (ws[key].v !== undefined && ws[key].v !== null && table_def.excel[0].firstrow.toString() === ws[key].v.toString()) {
                    var new_start_row = Number(XLS.utils.decode_cell(key).r) + 0;
                    var new_start_col = Number(XLS.utils.decode_cell(key).c) + 1;
                    sheet_start = XLSX.utils.encode_cell({r: new_start_row + 0, c: new_start_col + 0});
                    sheet_end = XLSX.utils.encode_cell({r: new_start_row + num_rows - 1, c: new_start_col + num_cols - 1});
                    table_start = XLSX.utils.decode_cell(sheet_start);
                    table_end = XLSX.utils.decode_cell(sheet_end);
                    found_row = true;
                    break;
                }
            }

            if (!found_row) {
                alertify.alert("<img src='style/cancel.png' alt='Error'>Error!",
                    "Spreadsheet format does not match original template. Please copy-and-paste or type data into the '" +
                    table_def.name + "' table manually.");
                return false;
            }
        }


        // Check coordinates at four corners of input section.
        // If any are undefined or non-numeric, emit error message.
        var points =
            [sheet_start,
            XLS.utils.encode_cell({r: num_rows + table_start.r - 1, c: table_start.c}),
                XLS.utils.encode_cell({r: table_start.r, c: table_start.c + num_cols - 1}),
            sheet_end];
        for (var p = 0; p < points.length; p++) {
            if (ws[points[p]] === undefined || isNaN(Number(ws[points[p]].v))) {
                alertify.alert("<img src='style/cancel.png' alt='Error'>Error!",
                    "Spreadsheet format does not match original template. Please copy-and-paste or type data into the '" +
                    table_def.name + "' table manually.");
                return false;
            }
        }


        // For each sheet, set value in handsontable.
        for (var r = 0; r < num_rows; r++) {
            for (var c = 0; c < num_cols; c++) {
                // Worksheet coordinates in Excel format.
                var sheet_coord = XLS.utils.encode_cell({
                    r: r + table_start.r,
                    c: c + table_start.c
                });

                if (ws[sheet_coord] !== undefined && ws[sheet_coord] !== null) {
                    changes.push([r, c, ws[sheet_coord].v]);
                } else {
                    // Undefined cell suggests empty cell(s).
                    alertify.alert("<img src='style/cancel.png' alt='Error'>Error!",
                        "Spreadsheet format does not match original template, or there is an empty cell in the spreadsheet. " +
                        "Please copy-and-paste or type data into the '" +
                        table_def.name + "' table manually.");
                    return false;
                }

            }
        }

        // Only updates Handsontable for non-null values.
        if (changes.length > 0) {
            table.setDataAtCell(changes);
        }

        return true;

    }

    // For drag-and-drop.

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        if (pending) return opts.errors.pending();
        var files = e.dataTransfer.files;
        readFile(files);
    }

    function handleDragover(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        $('#drop-area').removeClass('dragdefault');
        $('#drop-area').addClass('dragenter');
    }

    function handleDragleave(e) {
        $('#drop-area').removeClass('dragenter');
    }

    if (opts.drop.addEventListener) {
        opts.drop.addEventListener('dragenter', handleDragover, false);
        opts.drop.addEventListener('dragleave', handleDragleave);
        opts.drop.addEventListener('dragover', handleDragover, false);
        opts.drop.addEventListener('drop', handleDrop, false);
    }

    // For choosing a file using <input> (ie Choose File button).

    function handleFile(e) {
        var files = e.target.files;

        if (window.FileReader) {
            // FileReader is supported.
            readFile(files);
        } else {
            alertify.alert("<img src='style/cancel.png' alt='Error'>Error!", "FileReader is not supported in this browser.");
        }
    }


    if (opts.choose.addEventListener) {
        opts.choose.addEventListener('change', handleFile, false);
    }


};