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
  BigNumber: '/../bignumber.js/bignumber.min',
  jiff: '/../jiff/jiff-client',
  jiff_bignumber: '/../jiff/ext/jiff-client-bignumber',
  jiff_restAPI: '/../jiff/ext/jiff-client-restful'
});

require.shim = Object.assign(require.shim, {
  jiff: {
    exports: 'jiff'
  },
  jiff_bignumber: {
    deps: [ 'BigNumber' ],
    exports: 'jiff_bignumber',
    init: function (BigNumber) {
      this.jiff_bignumber.dependencies({ BigNumber: BigNumber });
    }
  },
  jiff_restAPI: {
    exports: 'jiff_restAPI'
  }
});
