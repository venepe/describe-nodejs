'use strict';

import DAO from '../dao';

function deleteAccount(user, userId) {
  return new DAO(user).User(userId).del();
}

module.exports = deleteAccount;
