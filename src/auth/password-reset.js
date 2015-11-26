'use strict';

const dao = require('../dao');

function PasswordReset(user, payload) {
  return dao(user).User(user.id).resetPassword(payload)
}

module.exports = PasswordReset;
