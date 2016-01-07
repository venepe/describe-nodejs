'use strict';

const dao = require('../dao');

function updatePassword(user, userId, payload) {
  return dao(user).User(userId).updatePassword(payload)
}

module.exports = updatePassword;
