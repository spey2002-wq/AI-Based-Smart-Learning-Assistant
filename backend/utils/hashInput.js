const crypto = require('crypto');

function hashUserInput(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

module.exports = { hashUserInput };
