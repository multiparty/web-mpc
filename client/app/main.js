require.config({
    'paths': {
        'jquery': 'helper/jquery',
        'Handsontable': 'helper/handsontable',
        'mpc': 'helper/mpc',
        'filesaver': 'helper/filesaver',
        'bootstrap' :  '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',
        'XLSX':'helper/xlsx',
        'Spinner': 'helper/spin', 
        'ResizeSensor': 'helper/ResizeSensor'      
        // 'DropSheet': 'helper/drop_sheet',
        // 'sheetjsw': 'helper/sheetjsw'

    },
    shim: {                                                                            
        'bootstrap': {                                                             
            deps: ['jquery']                                                     
        }
    }
});


require(['sessionView', 'trackView', 'clientView', 'unmaskView'], function(sessionView, trackView, clientView, unmaskView) {

    var sessionView = new sessionView();
    var trackView = new trackView();
    var clientView = new clientView();        
    var unmaskView = new unmaskView();


});