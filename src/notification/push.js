'use strict';

import { AppConfig } from '../config';
import DAO from '../dao';
import PushNotifications from 'node-pushnotifications';
import _ from 'lodash';
import path from 'path';

const settings = {
  gcm: {
    id: AppConfig.GCMToken,
    options: {},
    msgcnt: 0,
    dataDefaults: {
      delayWhileIdle: false,
      timeToLive: 4 * 7 * 24 * 3600,
      retries: 4
    }
  },
  apn: {
    gateway: 'gateway.push.apple.com',
    badge: 0,
    defaultData: {
      expiry: 4 * 7 * 24 * 3600,
      sound: 'ping.aiff'
    },
    cert: path.join(__dirname, '../../', 'certs/apns/cert.pem'),
    key: path.join(__dirname, '../../', 'certs/apns/key.pem')
  },
  adm: {
    client_id: null,
    client_secret: null,
    expiresAfter: 4 * 7 * 24 * 3600,
  }
};

const notificationHub = new PushNotifications(settings);

export const push = (user, projectId, payload) => {

  new DAO(user)
  .User(projectId)
  .getNotifiableFromProject()
  .then(({notifications}) => {
    let notificationIds =  _.flatten(_.map(notifications, 'notificationIds'));
    if (notificationIds.length > 0) {
      notificationHub.send(notificationIds, payload, (result) => {
        console.log('=========');
        console.log(result);
        console.log('=========');
      });
    }
  })
  .catch((err) => {
    console.log(err);
  });
}
