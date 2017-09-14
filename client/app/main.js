require.config({
  'paths': {
    'jquery': 'vendor/jquery',
    'bootstrap' :  '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',    
    'Handsontable': 'vendor/handsontable',
    'filesaver': 'vendor/filesaver',
    'XLSX':'vendor/xlsx',
    'spin': 'vendor/spin', 
    'forge': 'vendor/forge',
    'Ladda': 'vendor/ladda',
    'qtip': 'vendor/jquery_qtip',
    'alertify': 'vendor/alertify',
    'alertify-defaults': 'helper/alertify-defaults',
    'DropSheet': 'helper/drop_sheet',
    'mpc': 'helper/mpc',
    'ResizeSensor': 'helper/ResizeSensor',
    
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

  var sessionV = new sessionView();
  var trackV = new trackView();
  var clientV = new clientView();        
  var unmaskV = new unmaskView();


});