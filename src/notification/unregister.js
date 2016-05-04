'use strict';

import DAO from '../dao';

export const unregisterNotification = (user, userId, notificationId) => {
  let notification = {notificationId};
  return new DAO(user).User(userId).unregisterNotification(notification);
}
