'use strict';

import { AppConfig } from '../config';
import DAO from '../dao';
import PushNotifications from 'node-pushnotifications';
import _ from 'lodash';
import path from 'path';

const gcmNotRegistered = 'NotRegistered';
const apnsNotRegistered = 8;

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
    gateway: AppConfig.APNS_GATEWAY,
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
      notificationHub.send(notificationIds, payload, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let unregisterNotificationIds = [];
          _(result).forEach((value) => {
            if (value.failure > 0) {
              //check for devices to unregister
              let results = value.results;
              _.forEach((value) => {
                if (value.error === gcmNotRegistered || value.error === apnsNotRegistered) {
                  if (value.registration_id) {
                    unregisterNotificationIds.push(value.registration_id);
                  }
                }
              });
            }
          });

          if (unregisterNotificationIds.length > 0) {
            new DAO()
              .User()
              ._unregisterMultipleNotificationIds(unregisterNotificationIds);
          }
        }
      });
    }
  })
  .catch((err) => {
    console.log(err);
  });
}
