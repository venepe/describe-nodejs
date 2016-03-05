'use strict';

import DAO from '../dao';

function updatePassword(user, userId, payload) {
  return new DAO(user).User(userId).updatePassword(payload)
}

module.exports = updatePassword;
