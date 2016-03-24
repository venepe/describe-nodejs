'use strict';

import DAO from '../dao';

export const updatePassword = (user, userId, payload) => {
  return new DAO(user).User(userId).updatePassword(payload)
}
