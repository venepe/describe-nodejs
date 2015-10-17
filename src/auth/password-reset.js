var dao = require('../dao');

function PasswordReset(user, payload) {
  return dao(user).User(user.id).updatePassword(payload)
}

module.exports = PasswordReset;
