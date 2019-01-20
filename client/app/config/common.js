if (require === undefined) {
  var require = {};
}
if (require.paths == null) {
  require.paths = {};
}
if (require.shim == null) {
  require.shim = {};
}

require.paths = Object.assign(require.paths, {
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
  pki: 'helper/pki',
  ResizeSensor: 'vendor/ResizeSensor'
});

require.shim = Object.assign(require.shim, {
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
});
