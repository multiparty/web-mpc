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
  return undefined;
}

/**
 * Called when the submit button is pressed.
 */
function submit(target_url, tables) {
  // Create loading wheel
  var la = Ladda.create(this[0]);
  
  // Verify session key and email
  var session = $('#sess').val().trim();
  if (!session.match(/^[a-z0-9]{32}$/)) return error(SESSION_KEY_ERROR);
  
  var email = $('#emailf').val().trim();
  if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) return error(EMAIL_ERROR);
  
  // Verify confirmation check box was checked
  var verifyChecked = $('#verify').is(':checked');
  if (!verifyChecked) return error(UNCHECKED_ERR);
  
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
  if (!questionsValid) return error(ADD_QUESTIONS_ERR);
  
  // Verify tables
  tables[0].validateCells(function(result) {
    if(!result) return error(NUM_EMP_EMPTY_ERR);
    
    if($('#include-board').is(':checked'))
      tables[1].validateCells(function(result) {
        if(!result) return error(BOARD_INVALID_ERR);
        construct_data(target_url, tables, la);
      });
    else
      construct_data(target_url, tables, la);
  });
}

/**
 * All inputs are valid. Construct JSON objects and send them to the server.
 */
function construct_data(target_url, tables, la) {
  // Start loading animation
  //la.start();
  
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
  
  // Handle main table data, tables are represented as 2D associative arrays
  // with the first index being the row key, and the second being the column key
  var main_table = tables[0]; var main_meta = main_table.__sail_meta;
  var main_data = {};
  for(var r = 0; r < main_meta.rowsCount; r++) {
    for(var c = 0; c < main_meta.colsCount; c++) {
      var cell = main_meta.cells[r][c];
      var row_key = cell.row_key;
      var col_key = cell.col_key;
      
      if(main_data[row_key] == undefined) main_data[row_key] = {};
      main_data[row_key][col_key] = main_table.getDataAtCell(r, c);
    }
  }
  data_submission[main_meta.name] = main_data;
  
  // Handle board table data
  var include_board = $('#include-board').is(':checked');
  data_submission['include_board'] = (include_board ? 1 : 0);

  var board_table = tables[1]; var board_meta = board_table.__sail_meta;
  var board_data = {};
  for(var r = 0; r < board_meta.rowsCount; r++) {
    for(var c = 0; c < board_meta.colsCount; c++) {
      var cell = board_meta.cells[r][c];
      var row_key = cell.row_key;
      var col_key = cell.col_key;
      
      if(board_data[row_key] == undefined) board_data[row_key] = {};
      board_data[row_key][col_key] = (include_board ? board_table.getDataAtCell(r, c) : 0);
    }
  }
  data_submission[board_meta.name] = board_data;
  
  console.log(data_submission);
  
  // Secret share / mask the data.
  var shares = secretShareValues(data_submission);
  var data = shares['service'];
  var mask = shares['analyst'];
  
  encrypt_and_send(target_url, session, email, data, mask);
}

function encrypt_and_send(target_url, session, email, data, mask) {
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
    //la.stop();
    return response;
  }).catch(function (err) {
    console.log(err);
    if (err && err.hasOwnProperty('responseText')) alert(err.responseText);
    else alert(GENERIC_SUBMISSION_ERR);
    
    // Stop loading animation
    //la.stop();
  });
}




