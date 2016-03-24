'use strict';

import DAO from '../dao';

export const passwordReset = (user, payload) => {
  return new DAO(user).User(user.id).resetPassword(payload)
}
