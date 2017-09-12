require.config({
    'paths': {
        'jquery': 'helper/jquery',
        'Handsontable': 'helper/handsontable',
        'mpc': 'helper/mpc',
        'filesaver': 'helper/filesaver',
        "bootstrap" :  "//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min"         
        // 'DropSheet': 'helper/drop_sheet',
        // 'sheetjsw': 'helper/sheetjsw'

    },
    shim: {                                                                            
        'bootstrap': {                                                             
            deps: ['jquery']                                                     
        }
    }
});


require(['sessionView', 'trackView'], function(sessionView, trackView) {

    // var clientView = new clientView();    
    var sessionView = new sessionView();
    var trackView = new trackView();
    // var unmaskView = new unmaskView();


});