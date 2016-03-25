'use strict';

import DAO from '../dao';

export const passwordUpdate = (user, userId, payload) => {
  return new DAO(user).User(userId).updatePassword(payload)
}
