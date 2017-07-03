var SESSION_KEY_ERROR = 'Invalid session number: must be 32 character combination of letters and numbers';
var SESSION_KEY_ERROR = 'Invalid participation code: must be 32 character combination of letters and numbers';

var UNCHECKED_ERR = 'Please acknowledge that all data is correct and verified.';
var ADD_QUESTIONS_ERR = 'Please answer all Additional Questions.';

var GENERIC_TABLE_ERR = 'Please double-check the ';
var SERVER_ERR =  "Server not reachable.";
var GENERIC_SUBMISSION_ERR = 'Something went wrong with submission! Please try again.';

function error(msg) {
  alertify.alert("<img src='style/cancel.png' alt='Error'>Error!", msg);
}

function success(msg) {
  alertify.alert("<img src='style/accept.png' alt='Success'>Success!", msg);
}

/**
 * Called when the submit button is pressed.
 */
function validate(tables, callback) {
  // Verify session key
  var session = $('#sess').val().trim();
  if(!session.match(/^[a-z0-9]{32}$/))
    return callback(false, SESSION_KEY_ERROR);
    
  var userkey = $('#key').val().trim();
  if(!session.match(/^[a-z0-9]{32}$/))
    return callback(false, USER_KEY_ERROR);

  // Verify confirmation check box was checked
  var verifyChecked = $('#verify').is(':checked');
  if(!verifyChecked)
    return callback(false, UNCHECKED_ERR);

  // Verify additional questions
  var questionsValid = true;
  var questions = $('#questions form');
  for(var q = 0; q < questions.length; q++) {
    var thisQuestionIsValid = false;
    var radios = $(questions[q]).find('input[type=radio]');
    for(var r = 0; r < radios.length; r++)
      if(radios[r].checked) {
        thisQuestionIsValid = true;
        break;
      }

    if(!thisQuestionIsValid) {
      questionsValid = false;
      break;
    }
  }

  if(!questionsValid)
    return callback(false, ADD_QUESTIONS_ERR);

  // Validate tables (callback chaining)
  (function validate_callback(i) {
    if(i >= tables.length) return callback(true, "");

    // Dont validate tables that are not going to be submitted
    if(tables[i]._sail_meta.submit === false) return validate_callback(i+1);

    tables[i].validateCells(function(result) { // Validate table
      if(!result) return callback(false, GENERIC_TABLE_ERR + tables[i]._sail_meta.name + " spreadsheet");
      validate_callback(i+1);
    });
  })(0)
}

/**
 * All inputs are valid. Construct JSON objects and send them to the server.
 */
function construct_and_send(tables, la) {
  // Start loading animation
  la.start();

  // Begin constructing the data
  var data_submission = { questions: {} };

  var session = $('#sess').val().trim();
  var userkey = $('#key').val().trim();

  // Add questions data, each question has three parts:
  //  'YES', 'NO', and 'NA' and each one has value 0 or 1
  var questions = $('#questions form');
  var questions_text = questions.find('.question-text');
  for(var q = 0; q < questions.length; q++) {
    var question_data = {};
    var radios = $(questions[q]).find('input[type=radio]');
    for(var r = 0; r < radios.length; r++)
      question_data[radios[r].value] = (radios[r].checked ? 1 : 0);

    var text = $(questions_text[q]).text();
    data_submission['questions'][text] = question_data;
  }

  // Handle table data, tables are represented as 2D associative arrays
  // with the first index being the row key, and the second being the column key
  var tables_data = construct_data_tables(tables);
  for(var i = 0; i < tables_data.length; i++)
    data_submission[tables_data[i].name] = tables_data[i].data;

  // Secret share / mask the data.
  var shares = secretShareValues(data_submission);
  var data = shares['data'];
  var mask = shares['mask'];

  encrypt_and_send(session, userkey, data, mask, la);
}

var submitEntries = [];
function encrypt_and_send(session, userkey, data, mask, la) {
  // Hash userkey address for submission
  // var md = forge.md.sha1.create();
  // md.update(userkey);
  // userkey = md.digest().toHex().toString();

  // Get the public key to encrypt with
  var pkey_request = $.ajax({
    type: "POST",
    url: "/publickey",
    contentType: "application/json",
    data: JSON.stringify({session: session}),
    dataType: "text"
  });

  pkey_request.then(function(public_key) {
      mask = encryptWithKey(mask, public_key);
      var submission = {
        data: data,
        mask: mask,
        user: userkey,
        session: session
      };

      return $.ajax({
        type: "POST",
        url: "/",
        data: JSON.stringify(submission),
        contentType: 'application/json'
      });
  }).then(function(response) {
    var submitTime = new Date();
    submitEntries.push( { time: submitTime, submitted: true } );

    success("Submitted data.");
    convertToHTML(submitEntries);

    // Stop loading animation
    la.stop();
  }).catch(function (err) {
    var submitTime = new Date();
    submitEntries.push( { time: submitTime, submitted: false } );

    if (err && err.hasOwnProperty('responseText') && err.responseText !== undefined)
      error(err.responseText);
    else if (err && (err.status === 0 || err.status === 500))
      // check for status 0 or status 500 (Server not reachable.)
      error(SERVER_ERR);
    else
      error(GENERIC_SUBMISSION_ERR);

    convertToHTML(submitEntries);

    // Stop loading animation
    la.stop();
  });
}

/**
 * Convert the list of submissions into html for display.
 */
function convertToHTML(entries) {
  var htmlConcat = "<h3>Submission History</h3>";

  for (var i = 0; i < entries.length; i++) {
    if (entries[i]['submitted']) {
      // append success line
      htmlConcat += "<p class='success' alt='Success'><img src='style/accept.png'>Successful - "  + entries[i]['time'] + "</p>";
    } else {
      htmlConcat += "<p class='error' alt='Error'><img src='style/cancel.png'>Unsuccessful - " + entries[i]['time'] + "</p>";
    }
  }
  $('.page-footer').html(htmlConcat);
}
