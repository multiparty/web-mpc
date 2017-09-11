require.config({
    'paths': {
        'jquery': 'helper/jquery',
        // 'handsontable': 'helper/handsontable',
        'mpc': 'helper/mpc'
    }
    // shim: {                                                                            
    //     'handsontable': {                                                             
    //         deps: ['jquery'],                                                           
    //         exports: 'Handsontable'                                                     
    //     }
    // }
});


require(['clientView', 'sessionView', 'trackView', 'unmaskView'], function(clientView, sessionView, trackView, unmaskView) {

    // var clientView = new clientView();    
    var sessionView = new sessionView();
    var trackView = new trackView();
    var unmaskView = new unmaskView();


});