'use strict';

const dao = require('../dao');

function deleteAccount(user, userId) {
  return dao(user).User(userId).del();
}

module.exports = deleteAccount;
