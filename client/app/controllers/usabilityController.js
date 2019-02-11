define(['table_template', 'mpc'], function (table_template, mpc) {

  var analytics = {};

  function initialize() {
    for (var metric of table_template.usability) {
      if (typeof(metric) === 'string') {
        analytics[metric] = 0;
      } else if (typeof(metric) === 'object') {
        var key = Object.keys(metric)[0];
        var fields = metric[key];
        analytics[key] = {};

        for (var f of fields) {
          analytics[key][f] = 0;
        }
      } 
    }
  }

  function detectBrave() {
    // initial assertions
    if (!window.google_onload_fired &&
         navigator.userAgent &&
        !navigator.userAgent.includes('Chrome'))
      return false;
  
    // set up test
    var test = document.createElement('iframe');
    test.style.display = 'none';
    document.body.appendChild(test);
  
    // empty frames only have this attribute set in Brave Shield
    var is_brave = (test.contentWindow.google_onload_fired === true);
  
    // teardown test
    test.parentNode.removeChild(test);
  
    return is_brave;
  }
  // for (var i = 0; i < MOUSE_PRECISION_WIDTH; i++) {
  //   analytics.mouse_positions.push([]);
  //   analytics.mouse_clicks.push([]);
  //   for (var k = 0; k < MOUSE_PRECISION_HEIGHT; k++) {
  //     analytics.mouse_positions[i].push(0);
  //     analytics.mouse_clicks[i].push(0);
  //   }
  // }
  // // currently the client width:height ratio is ~ 0.45:1
  // /*
  //   [ [ [], [], ..., [] ],
  //     [ [], [], ..., [] ],
  //     [ [], [], ..., [] ],
  //     [ [], [], ..., [] ],
  //   ]
  //   */
//   function getPos(event) {

//     // TODO: make sure this is consistent across browsers
//     var height;
//     var width;
//     if (event.pageX === null && event.clientX !== null) {
//       var doc = eventDoc.documentElement;
//       var body = eventDoc.body;


//       event.pageX = event.clientX +
//         (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
//         (doc && doc.clientLeft || body && body.clientLeft || 0);
//       event.pageY = event.clientY +
//         (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
//         (doc && doc.clientTop  || body && body.clientTop  || 0 );
//     }
//     width = window.innerWidth
//       || document.documentElement.clientWidth
//       || document.body.clientWidth;

//     height = document.body.scrollHeight;
//     return [event.pageX / width, event.pageY / height];
//   }

//   function updateValidationError(error) {
//     console.log(analytics);

//     if (!(error in analytics.validation_errors)) {
//       analytics.validation_errors[error] = 1;
//       return;
//     } 

//     analytics.validation_errors[error]++;
//   }

//   function handleMouseClick(event) {
//     // y coord should potentially be mult. by 100
//     // to account for difference in x, y page size

//     var pos = getPos(event);
//     var x = Math.floor(pos[0] * MOUSE_PRECISION_WIDTH);
//     var y = Math.floor(pos[1] * MOUSE_PRECISION_HEIGHT);
//     //each array stores # of hits at this area
//     analytics.mouse_clicks[x][y]++;
//   }


//   function handleMouseMove(event) {
//     // y coord should potentially be mult. by 100
//     // to account for difference in x, y page size

//     var pos = getPos(event);
//     var x = Math.floor(pos[0] * MOUSE_PRECISION_WIDTH);
//     var y = Math.floor(pos[1] * MOUSE_PRECISION_HEIGHT);
//     //each array stores # of hits at this area
//     analytics.mouse_positions[x][y]++;
//   }

//   let startDate = new Date();
//   let elapsedTime = 0;

//   const focus = function () {
//     startDate = new Date();
//   };

//   const blur = function () {
//     const endDate = new Date();
//     const spentTime = endDate.getTime() - startDate.getTime();
//     elapsedTime += spentTime;
//   };

  function saveBrowser() {
    // check Edge
    var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|edge|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
    var browser = M[0].toLowerCase();

    if (detectBrave) {
      analytics.browser.brave += 1;
      return;
    }

    for (let key in analytics.browser) {
      if (browser.includes(key)) {
        analytics.browser[key] += 1;
        return;
      }
    }
    analytics.browser.other += 1;
 }

 function addValidationError(err) {
  console.log('err', err)
  analytics.validation_errors[err] += 1;
 }

 function dataPrefilled() {
  analytics.data_prefilled += 1;
 }

//   const beforeunload = function () {
//     const endDate = new Date();
//     const spentTime = endDate.getTime() - startDate.getTime();
//     elapsedTime += spentTime;
//     analytics['time_ms'] = elapsedTime;
//     // elapsedTime contains the time spent on page in milliseconds
//   };

  return {
    addValidationError: addValidationError,
    analytics: analytics,
    dataPrefilled: dataPrefilled,
    initialize: initialize,
    // handleMouseClick: handleMouseClick,
    // handleMouseMove: handleMouseMove,
    // focus: focus,
    // blur: blur,
    // beforeunload: beforeunload,
    // updateValidationError: updateValidationError,
    saveBrowser: saveBrowser
  };
});
