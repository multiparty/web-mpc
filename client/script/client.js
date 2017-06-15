var SESSION_KEY_ERROR = 'Invalid session number: must be 32 character combination of letters and numbers';
var EMAIL_ERROR = 'Did not type a correct email address';

var UNCHECKED_ERR = 'Please acknowledge that all data is correct and verified.';
var ADD_QUESTIONS_ERR = 'Please answer all Additional Questions.';

var NUM_EMP_EMPTY_ERR = 'Please double-check the Number of Employees spreadsheet.';
var BOARD_INVALID_ERR = 'Please double-check the Board of Directors spreadsheet \n' +
                        'or uncheck the Provide Board of Directors Information checkbox.';
var TABLE_ERR = [ NUM_EMP_EMPTY_ERR, BOARD_INVALID_ERR ]

var GENERIC_SUBMISSION_ERR = 'Something went wrong with submission! Please try again.';

function error(msg) {
  alert(msg);
  return undefined;
}

/**
 * Called when the submit button is pressed.
 */
function submit(tables) {
  // Create loading wheel
  var la = Ladda.create(this);
  
  // Verify session key and email
  var session = $('#sess').val().trim();
  if (!sessionstr.match(/^[a-z0-9]{32}$/)) return error(SESSION_KEY_ERROR);
  
  var email = $('#emailf').val().trim();
  if (!emailstr.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) return alert("");
  
  // Verify additional questions
  var verifyChecked = $('#verify').is(':checked');
  if (!verifyChecked) return error(UNCHECKED_ERR);
  
  var questionsValid = checkQuestions($('#questions form'));
  if (!questionsValid) return error(ADD_QUESTIONS_ERR);
  
  // Verify tables (its asynchronous)
  var _ = function validate_cells(i) {
    if(i >= tables.length)
      return submit_is_valid(tables, la);
      
    tables[i].validateCells(
      function(result) { 
        if(result) validate_cells(i+1); 
        else error(TABLE_ERR[i]);
      }
    );    
  }(0);
}

function submit_valid(tables, la) {

}
