/***************************************************************
 *
 * initiator/script/signup.js
 *
 * Interface for signing up as a collection initiator.
 *
 */

function signup (emailID) {
    var emailstr = $('#emailID').val().trim();

    if (!emailstr.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)){
      alert("Did not type a correct email address");
      return;
    }

    $.ajax({
      type: 'POST',
      url: '/initiator_signup',
      data: JSON.stringify({email: emailstr}),
      contentType: 'application/json'
    })
    .then(function (response) {
        console.log(response);
        alert('Check your email for token.');
        return response;
    })
    .catch(function (err) {
        console.log(err);
        alert('Something went wrong during token generation.')
    });
}

/*eof*/
