const base32Encode = require('base32-encode');
const crypto = require('crypto');

const TOKEN_LENGTH = 16;
function generateRandomBase32(length) {
  if (length == null) {
    length = TOKEN_LENGTH;
  }
  return base32Encode(crypto.randomBytes(length), 'Crockford').toString().toLowerCase()
}

module.exports = {
  generateRandomBase32: generateRandomBase32
};
