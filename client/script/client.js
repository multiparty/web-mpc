var SESSION_KEY_ERROR = 'Invalid session number: must be 26-character combination of letters and numbers';
var PARTICIPATION_CODE_ERROR = 'Invalid participation code: must be 26-character combination of letters and numbers';

var UNCHECKED_ERR = 'Please acknowledge that all data is correct and verified.';
var ADD_QUESTIONS_ERR = 'Please answer all Additional Questions.';

var GENERIC_TABLE_ERR = 'Please double-check the ';
var SERVER_ERR = "Server not reachable.";
var GENERIC_SUBMISSION_ERR = 'Something went wrong with submission! Please try again.';

function error(msg) {
  alertify.alert("<img src='style/cancel.png' alt='Error'>Error!", msg);
}

function success(msg) {
  alertify.alert("<img src='style/accept.png' alt='Success'>Success!", msg);
}

// When the session and/or participation code is modified, fetch session info from server.
function verify_keys_and_fetch_description() {
  var session = $("#session").val().trim().toLowerCase();
  var participationCode = $("#participation-code").val().trim().toLowerCase();

  if(session == "" || participationCode == "") return;

  $.ajax({
    type: "POST",
    url: "/sessioninfo",
    contentType: "application/json",
    data: JSON.stringify({session: session, userkey: participationCode}),
    dataType: "text"
  }).then(function(response) {
    response = JSON.parse(response);
    var title = response.title;
    var description = response.description;

    //$("#session-title").html(title);
    //$("#session-description").html(description);

    var $parent = $('#session, #participation-code').parent();
    $parent.removeClass('has-error').addClass('has-success has-feedback');
    $parent.find('.success-icon').removeClass('hidden').addClass('show');
    $parent.find('.fail-icon').removeClass('show').addClass('hidden');
    $parent.find('.fail-help').removeClass('show').addClass('hidden');
    $parent.find('.fail-custom').removeClass('show').addClass('hidden');
  }).catch(function(err) {
    var errorMsg = SERVER_ERR;
    if (err && err.hasOwnProperty('responseText') && err.responseText !== undefined)
      errorMsg = err.responseText;

    var $parent = $('#session, #participation-code').parent();
    $parent.removeClass('has-success').addClass('has-error has-feedback');
    $parent.find('.success-icon').removeClass('show').addClass('hidden');
    $parent.find('.fail-icon').removeClass('hidden').addClass('show');
    $parent.find('.fail-help').removeClass('show').addClass('hidden');
    $parent.find('.fail-custom').removeClass('hidden').addClass('show').html(errorMsg);
  });
}

/**
 * Called when the submit button is pressed.
 */
function validate(tables, callback) {
  var errors = [];
  // Verify session key
  var session = $('#session').val().trim();
  if (!session.match(/^[a-zA-Z0-9]{26}$/)) {
    errors = errors.concat(SESSION_KEY_ERROR);
  }

  var participationCode = $('#participation-code').val().trim();
  if (!participationCode.match(/^[a-zA-Z0-9]{26}$/)) {
    errors = errors.concat(PARTICIPATION_CODE_ERROR);
  }

  // Verify confirmation check box was checked
  var verifyChecked = $('#verify').is(':checked');
  if(!verifyChecked) {
    errors = errors.concat(UNCHECKED_ERR);
  }

  // Verify additional questions
  var questionsValid = true;
  var questions = $('#questions form');
  for (var q = 0; q < questions.length; q++) {
    var thisQuestionIsValid = false;
    var radios = $(questions[q]).find('input[type=radio]');
    for (var r = 0; r < radios.length; r++)
      if (radios[r].checked) {
        thisQuestionIsValid = true;
        break;
      }

    if (!thisQuestionIsValid) {
      questionsValid = false;
      break;
    }
  }

  if(!questionsValid) {
    errors = errors.concat(ADD_QUESTIONS_ERR);
  }

  // Validate tables (callback chaining)
  (function validate_callback(i) {
    if(i >= tables.length) {
      if(errors.length === 0)
        return callback(true, "");
      else
        return callback(false, errors);
    }
    
    // Dont validate tables that are not going to be submitted
    if (tables[i]._sail_meta.submit === false) return validate_callback(i + 1);

    tables[i].validateCells(function(result) { // Validate table
      if(!result) {
        errors = errors.concat(GENERIC_TABLE_ERR + tables[i]._sail_meta.name + " spreadsheet");
      }

      validate_callback(i + 1);
    });
  })(0);

}

/**
 * All inputs are valid. Construct JSON objects and send them to the server.
 */
function construct_and_send(tables, la) {
  // Start loading animation
  la.start();

  // Begin constructing the data
  var data_submission = {questions: {}};

  var session = $('#session').val().trim().toLowerCase();
  var participationCode = $('#participation-code').val().trim().toLowerCase();

  // Add questions data, each question has three parts:
  //  'YES', 'NO', and 'NA' and each one has value 0 or 1
  var questions = $('#questions form');
  var questions_text = questions.find('.question-text');
  for (var q = 0; q < questions.length; q++) {
    var question_data = {};
    var radios = $(questions[q]).find('input[type=radio]');
    for (var r = 0; r < radios.length; r++) {
      var value = radios[r].value;
      value = value.replace(/\s+/g, ' ');
      question_data[value] = (radios[r].checked ? 1 : 0);
    }

    var text = $(questions_text[q]).text();
    text = text.replace(/\s+/g, ' '); // Replace many white spaces with just one space.
    data_submission['questions'][text] = question_data;
  }

  // Handle table data, tables are represented as 2D associative arrays
  // with the first index being the row key, and the second being the column key
  var tables_data = construct_data_tables(tables);
  for (var i = 0; i < tables_data.length; i++)
    data_submission[tables_data[i].name] = tables_data[i].data;

  // Secret share / mask the data.
  var shares = secretShareValues(data_submission);
  var data = shares['data'];
  var mask = shares['mask'];

  encrypt_and_send(session, participationCode, data, mask, la);
}

var submitEntries = [];
function encrypt_and_send(session, participationCode, data, mask, la) {
  // Get the public key to encrypt with
  var pkey_request = $.ajax({
    type: "POST",
    url: "/publickey",
    contentType: "application/json",
    data: JSON.stringify({session: session}),
    dataType: "text"
  });

  pkey_request.then(function (public_key) {
    mask = encryptWithKey(mask, public_key);
    var submission = {
      data: data,
      mask: mask,
      user: participationCode,
      session: session
    };

    return $.ajax({
      type: "POST",
      url: "/",
      data: JSON.stringify(submission),
      contentType: 'application/json'
    });
  }).then(function (response) {
    var submitTime = new Date();
    submitEntries.push({time: submitTime, submitted: true});

    success("Submitted data.");
    convertToHTML(submitEntries);

    // Stop loading animation
    la.stop();
  }).catch(function (err) {
    var submitTime = new Date();
    submitEntries.push({time: submitTime, submitted: false});

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
  var $submissionHistory = $('#submission-history');
  $submissionHistory.empty();
  for (var i = 0; i < entries.length; i++) {
    if (entries[i]['submitted']) {
      // append success line
      $submissionHistory.append("<li><span class='success'><img src='style/accept.png' alt='Success'>Successful - "  + entries[i]['time'] + "</span></li>")
    } else {
      $submissionHistory.append("<li><span class='error'><img src='style/cancel.png' alt='Error'>Unsuccessful - " + entries[i]['time'] + "</span></li>")
    }
  }
}
