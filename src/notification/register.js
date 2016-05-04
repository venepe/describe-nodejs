'use strict';

import DAO from '../dao';

export const registerNotification = (user, userId, notification) => {
  return new DAO(user).User(userId).registerNotification(notification);
}
