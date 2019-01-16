var require = {
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
    table_template: 'data/pacesetters',
    io: '/socket.io.js',
    BigNumber: '/bignumber.js/bignumber.min.js',
    sodium: '/jiff/sodium.js',
    jiff: '/jiff/jiff-client.js',
    jiff_bignumber: '/jiff/ext/jiff-client-bignumber.js',
    jiff_restAPI: '/jiff/ext/jiff-client-restAPI.js'
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
};
