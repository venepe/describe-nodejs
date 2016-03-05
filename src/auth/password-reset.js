'use strict';

import DAO from '../dao';

function passwordReset(user, payload) {
  return new DAO(user).User(user.id).resetPassword(payload)
}

module.exports = passwordReset;
