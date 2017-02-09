/***************************************************************
 *
 * validate.js
 *
 * Shared module for validating submitted data.
 *
 */

function validate(obj, props) {
    for (var key in props) {
        var type = props[key];
        if (obj.hasOwnProperty(key)) {
            var value = obj[key];
            if (typeof value !== type) {
                console.log('Error: Bad type:', key, typeof value, type);
                return false;
            }
        }
        else {
            console.log('Error: missing prop:', key);
            return false;
        }
    }
    return true;
}

if (typeof module !== 'undefined')
    module.exports = {'validate': validate};

/*eof*/
