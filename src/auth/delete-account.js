'use strict';

import DAO from '../dao';

export const deleteAccount = (user, userId) => {
  return new DAO(user).User(userId).del();
}
