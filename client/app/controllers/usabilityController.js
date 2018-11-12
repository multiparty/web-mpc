define(['jquery', 'filesaver', 'alertify', 'qtip'], function ($, filesaver, alertify) {

  var MOUSE_PRECISION_WIDTH = 90;
  var MOUSE_PRECISION_HEIGHT = 200;


  var analytics = {

    validation_errors: {

      SESSION_KEY_ERROR: 0,
      PARTICIPATION_CODE_ERROR: 0,
      SESSION_PARTICIPATION_CODE_SERVER_ERROR: 0,
      UNCHECKED_ERR: 0,
      ADD_QUESTIONS_ERR: 0,
      GENERIC_TABLE_ERR: 0,
      SERVER_ERR: 0,
      GENERIC_SUBMISSION_ERR: 0,
      NAN_EMPTY_CELLS: 0,
      SEMANTIC_CELLS: 0,
    },
    mouse_positions: [],
    mouse_clicks: [],
    time_ms: 0,
  };
  for (var i = 0; i < MOUSE_PRECISION_WIDTH; i++) {
    analytics.mouse_positions.push([]);
    analytics.mouse_clicks.push([]);
    for (var k = 0; k < MOUSE_PRECISION_HEIGHT; k++) {
      analytics.mouse_positions[i].push(0);
      analytics.mouse_clicks[i].push(0);
    }
  }
  // currently the client width:height ratio is ~ 0.45:1
  /*
    [ [ [], [], ..., [] ],
      [ [], [], ..., [] ],
      [ [], [], ..., [] ],
      [ [], [], ..., [] ],
    ]
    */
  function getPos(event) {

    // TODO: make sure this is consistent across browsers
    var height;
    var width;
    if (event.pageX === null && event.clientX !== null) {
      var doc = eventDoc.documentElement;
      var body = eventDoc.body;


      event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY +
        (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
        (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }
    width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;

    height = document.body.scrollHeight;
    return [event.pageX / width, event.pageY / height];
  }

  function handleMouseClick(event) {
    // y coord should potentially be mult. by 100
    // to account for difference in x, y page size

    var pos = getPos(event);
    var x = Math.floor(pos[0] * MOUSE_PRECISION_WIDTH);
    var y = Math.floor(pos[1] * MOUSE_PRECISION_HEIGHT);
    //each array stores # of hits at this area
    analytics.mouse_clicks[x][y]++;
  }
  function handleMouseMove(event) {
    // y coord should potentially be mult. by 100
    // to account for difference in x, y page size

    var pos = getPos(event);
    var x = Math.floor(pos[0] * MOUSE_PRECISION_WIDTH);
    var y = Math.floor(pos[1] * MOUSE_PRECISION_HEIGHT);
    //each array stores # of hits at this area
    analytics.mouse_positions[x][y]++;
  }

  let startDate = new Date();
  let elapsedTime = 0;

  const focus = function () {
    startDate = new Date();
  };

  const blur = function () {
    const endDate = new Date();
    const spentTime = endDate.getTime() - startDate.getTime();
    elapsedTime += spentTime;
  };

  const beforeunload = function () {
    const endDate = new Date();
    const spentTime = endDate.getTime() - startDate.getTime();
    elapsedTime += spentTime;
    analytics['time_ms'] = elapsedTime;
    // elapsedTime contains the time spent on page in milliseconds
  };

  return {
    analytics: analytics,
    handleMouseClick: handleMouseClick,
    handleMouseMove: handleMouseMove,
    focus: focus,
    blur: blur,
    beforeunload: beforeunload,
  };
});
