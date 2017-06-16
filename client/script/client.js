var SESSION_KEY_ERROR = 'Invalid session number: must be 32 character combination of letters and numbers';
var EMAIL_ERROR = 'Did not type a correct email address';

var UNCHECKED_ERR = 'Please acknowledge that all data is correct and verified.';
var ADD_QUESTIONS_ERR = 'Please answer all Additional Questions.';

var NUM_EMP_EMPTY_ERR = 'Please double-check the Number of Employees spreadsheet.';
var BOARD_INVALID_ERR = 'Please double-check the Board of Directors spreadsheet \n' +
                        'or uncheck the Provide Board of Directors Information checkbox.';

var GENERIC_SUBMISSION_ERR = 'Something went wrong with submission! Please try again.';

function error(msg) {
  alert(msg);
}

/**
 * Called when the submit button is pressed.
 */
function validate(tables, callback) {
  // Verify session key and email
  var session = $('#sess').val().trim();
  if (!session.match(/^[a-z0-9]{32}$/)) return callback(false, SESSION_KEY_ERROR);
  
  var email = $('#emailf').val().trim();
  if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) return callback(false, EMAIL_ERROR);
  
  // Verify confirmation check box was checked
  var verifyChecked = $('#verify').is(':checked');
  if (!verifyChecked) return callback(false, UNCHECKED_ERR);
  
  // Verify additional questions
  var questionsValid = true;
  var questions = $('#questions form');
  for(var q = 0; q < questions.length; q++) {
    var thisQuestionIsValid = false;
    var radios = $(questions[q]).find('input[type=radio]');
    for(var r = 0; r < radios.length; r++)
      if(radios[r].checked) { thisQuestionIsValid = true; break; }
    
    if(!thisQuestionIsValid) { questionsValid = false; break; }
  }
  if (!questionsValid) return callback(false, ADD_QUESTIONS_ERR);
  
  // Verify tables
  tables[0].validateCells(function(result) {
    if(!result) return callback(false, NUM_EMP_EMPTY_ERR);
    
    if($('#include-board').is(':checked'))
      tables[1].validateCells(function(result) {
        if(!result) return callback(false, BOARD_INVALID_ERR);
        callback(true, "");
      });
    else
      callback(true, "");
  });
}

/**
 * All inputs are valid. Construct JSON objects and send them to the server.
 */
function construct_and_send(target_url, tables, la) {
  // Start loading animation
  la.start();
  
  // Begin constructing the data  
  var data_submission = { 'questions': {} };
  
  var session = $('#sess').val();
  var email = $('#emailf').val();
  
  // Add questions data, each question has three parts:
  //  'YES', 'NO', and 'NA' and each one has value 0 or 1
  var questions = $('#questions form');
  for(var q = 0; q < questions.length; q++) {
    var question_data = {};
    var question_text = $($(questions[q]).find('.question-text')[0]).text();
    var radios = $(questions[q]).find('input[type=radio]');
    for(var r = 0; r < radios.length; r++)
      question_data[radios[r].value] = (radios[r].checked ? 1 : 0);
    
    data_submission['questions'][question_text] = question_data;
  }
  
  // Handle board table data
  var include_board = $('#include-board').is(':checked');
  data_submission['include_board'] = (include_board ? 1 : 0);
  
  // Handle table data, tables are represented as 2D associative arrays
  // with the first index being the row key, and the second being the column key
  var tables_data = construct_data_tables(tables);
  for(var i = 0; i < tables_data.length; i++)
    data_submission[tables_data[i].name] = tables_data[i].data;
    
  console.log(data_submission);
  
  // Secret share / mask the data.
  var shares = secretShareValues(data_submission);
  var data = shares['service'];
  var mask = shares['analyst'];
  
  encrypt_and_send(target_url, session, email, data, mask, la);
}

function encrypt_and_send(target_url, session, email, data, mask, la) {
  // Hash email address for submission
  var md = forge.md.sha1.create();
  md.update(email);
  email = md.digest().toHex().toString();
  
  // Get the public key to encrypt with
  var pkey_request = $.ajax({ 
    type: "POST", url: "/publickey", contentType: "application/json", 
    data: JSON.stringify({session: session}), dataType: "text" 
  });
  
  pkey_request.then(function(public_key) {
      mask = encryptWithKey(mask, public_key);
      var submission = {
        data: data,
        mask: mask,
        user: email,
        session: session
      };
      
      return $.ajax({
        type: "POST", url: target_url,
        data: JSON.stringify(submission), contentType: 'application/json'
      });
  }).then(function(response) {
    console.log(response);
    alert("Submitted data.");
    
    // Stop loading animation
    la.stop();
    return response;
  }).catch(function (err) {
    console.log(err);
    if (err && err.hasOwnProperty('responseText')) alert(err.responseText);
    else alert(GENERIC_SUBMISSION_ERR);
    
    // Stop loading animation
    la.stop();
  });
}




