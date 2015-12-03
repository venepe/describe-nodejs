'use strict';

const dao = require('../dao');

function passwordReset(user, payload) {
  return dao(user).User(user.id).resetPassword(payload)
}

module.exports = passwordReset;
