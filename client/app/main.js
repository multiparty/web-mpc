require.config({
    'paths': {
        'jquery': 'helper/jquery',
        'Handsontable': 'helper/handsontable',
        'mpc': 'helper/mpc',
        'DropSheet': 'helper/drop_sheet',
        'sheetjsw': 'helper/sheetjsw'

    },
    shim: {                                                                            
        'DropSheet': {                                                             
            deps: ['sheetjsw'],                                                           
            exports: 'DropSheet'                                                     
        }
    }
});


require(['clientView', 'sessionView', 'trackView', 'unmaskView'], function(clientView, sessionView, trackView, unmaskView) {

    // var clientView = new clientView();    
    var sessionView = new sessionView();
    var trackView = new trackView();
    var unmaskView = new unmaskView();


});