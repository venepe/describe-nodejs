'use strict';

const dao = require('../dao');

function DeleteAccount(user, userId) {
  return dao(user).User(userId).del();
}

module.exports = DeleteAccount;
