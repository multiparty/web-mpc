require.config({
  paths: {
    jquery: 'vendor/jquery',
    bootstrap: 'vendor/bootstrap.min',
    Handsontable: 'vendor/handsontable',
    filesaver: 'vendor/filesaver',
    XLSX: 'vendor/xlsx',
    spin: 'vendor/spin',
    forge: 'vendor/forge',
    Ladda: 'vendor/ladda',
    qtip: 'vendor/jquery_qtip',
    alertify: 'vendor/alertify',
    alertify_defaults: 'helper/alertify_defaults',
    DropSheet: 'helper/drop_sheet',
    mpc: 'helper/mpc',
    ResizeSensor: 'vendor/ResizeSensor',
    table_template: 'data/tables'

  },
  shim: {
    bootstrap: {
      deps: ['jquery']
    },
    spin: {
      exports: 'spin'
    },
    Ladda: {
      deps: ['spin'],
      exports: 'Ladda'
    }
  }
});
