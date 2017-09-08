require.config({
    'paths': {
        'jquery': 'helper/jquery',
    }
});


require(['analystView'], function(analystView) {
    var analystView = new analystView();
});