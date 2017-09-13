require.config({
  'paths': {
    'jquery': 'vendor/jquery',
    'bootstrap' :  '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',    
    'Handsontable': 'vendor/handsontable',
    'mpc': 'helper/mpc',
    'filesaver': 'vendor/filesaver',
    'XLSX':'helper/xlsx',
    'spin': 'vendor/spin', 
    'forge': 'vendor/forge',
    'ResizeSensor': 'helper/ResizeSensor',
    'Ladda': 'vendor/ladda',
    'qtip': 'vendor/jquery_qtip',
    'alertify': 'vendor/alertify',
    'alertify-defaults': 'helper/alertify-defaults'

    // 'DropSheet': 'helper/drop_sheet',
    // 'sheetjsw': 'helper/sheetjsw'

  },
  shim: {                                                                            
    'bootstrap': {                                                             
      deps: ['jquery']                                                     
    },
    'spin': {
      exports: 'spin'
    },
    'Ladda':{
      deps: ['spin'],
      exports: 'Ladda'
    }
  }
});


require(['sessionView', 'trackView', 'clientView', 'unmaskView'], function(sessionView, trackView, clientView, unmaskView) {

  var sessionView = new sessionView();
  var trackView = new trackView();
  var clientView = new clientView();        
  var unmaskView = new unmaskView();


});