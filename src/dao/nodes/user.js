'use strict';

const _class = 'User';
import uuid from 'node-uuid';
import { SMTIValidator } from '../validator';
import { authToken, filteredObject, SMTICrypt, Base64, Pagination, GraphQLHelper, uuidToId } from '../../utilities';
import { roles } from '../permissions';

import {
  User
} from '../model';

class UserDAO {
  constructor(targetId, params) {
    this.targetId = targetId;
    this.params = params;
  }

  get() {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getUser()
      .from(_class)
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let user = new User();
        return filteredObject(record, '@.*|rid', user);
      })
      .one()
      .then((record) => {
        resolve(record);
      })
      .catch((e) => {
        reject();
      })
      .done();
    });
  }

  inEdgeCreated() {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getUser()
      .inCreatesFromNode(id)
      .limit(25)
      .transform((record) => {
        return filteredObject(record, '@.*|rid');
      })
      .all()
      .then((records) => {
        resolve(records);
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  create(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;

      let validator = new SMTIValidator(object);

      validator
        .isUser()
        .then((object) => {
          return new Promise((resolve, reject) => {
            SMTICrypt.encrypt(object.password)
              .then((hash) => {
                object.password = hash;
                resolve(object);
              })
              .catch((error) => {
                console.log(error);
                reject({error});
              });
          });
        })
        .then((object) => {
          let _allow = {};
          let role = uuid.v4().replace(/[-]/g, '_');
          _allow[role] = roles.owner;
          object.role = role;

          db
          .create('vertex', 'User')
          .set(object)
          .set({ _allow })
          .transform((record) => {
            return filteredObject(record, 'in_.*|out_.*|@.*|password|^_');
          })
          .one()
          .then((user) => {
            if(user) {
              let email = user.email;
              let uuid = user.uuid;
              let role = user.role;
              let id = Base64.base64('User:' + uuid);
              let payload = {
                email,
                id,
                role
              };
              let authenticate = authToken(payload);

              user.authenticate = authenticate;

              user = uuidToId(user);

              resolve(user);
            } else {
              reject({});
            }

          })
          .catch((e) => {
            console.log(`orientdb error: ${e}`);
            reject();
          })
          .done();
        })
        .catch((errors) => {
          console.log(errors);
          reject(errors);
        })
    });
  }

  update(object) {
    return new Promise((resolve, reject) => {
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      if (userId === targetId) {
        let validator = new SMTIValidator(object, true);

        validator
          .isUser()
          .then((object) => {
            db
            .let('update', (s) => {
              s
              .update(_class)
              .set(object)
              .where({
                uuid: targetId
              })
              .where(
                `_allow["${role}"] = ${roles.owner}`
              )
            })
            .let('user', (s) => {
              s
              .getUser()
              .from(_class)
              .where({
                uuid: targetId
              })
            })
            .commit()
            .return('$user')
            .transform((record) => {
              return filteredObject(record, 'in_.*|out_.*|@.*|password|^_');
            })
            .one()
            .then((record) => {
              resolve(record);
            })
            .catch((e) => {
              console.log(`orientdb error: ${e}`);
              reject();
            })
            .done();
          })
          .catch((errors) => {
            console.log(errors);
            reject(errors);
          });
      } else {
        console.log('erros');
        reject({});
      }
    });
  }

  updatePassword(object) {
    return new Promise((resolve, reject) => {
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;
      let userRecord = {};
      let results = [];

      if (userId === targetId) {
        let validator = new SMTIValidator(object);
        let currentPassword = object.current;
        let newPassword = object.new;

        validator
          .isPassword()
          .then((object) => {
            return db
                    .select('*')
                    .from(_class)
                    .where({
                      uuid: targetId,
                    })
                    .limit(1)
                    .one();
          })
          .then((userRecord) => {
            return SMTICrypt.compare(object.current, userRecord.password);
          })
          .then(() => {
            return SMTICrypt.encrypt(object.new);
          })
          .then((newHash) => {
            db
            .update(_class)
            .set({
              password: newHash
            })
            .where({
              uuid: targetId
            })
            .where(
              `_allow["${role}"] = ${roles.owner}`
            )
            .scalar()
            .then((results) => {
              if (results > 0) {
                resolve();
              } else {
                reject();
              }
            })
            .catch((e) => {
              console.log(`orientdb error: ${e}`);
              reject();
            })
          })
          .catch((errors) => {
            console.log(errors);
            reject(errors);
          });
      } else {
        reject({});
      }
    });
  }

  resetPassword(object) {
    return new Promise((resolve, reject) => {
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;
      let userRecord = {};
      let results = [];

      if (userId === targetId) {
        let validator = new SMTIValidator(object);
        let currentPassword = object.current;
        let newPassword = object.new;

        validator
          .isReset()
          .then((object) => {
            return SMTICrypt.encrypt(object.password);
          })
          .then((newHash) => {
            db
            .update(_class)
            .set({
              password: newHash
            })
            .where({
              uuid: targetId
            })
            .where(
              `_allow["${role}"] = ${roles.owner}`
            )
            .scalar()
            .then((results) => {
              if (results > 0) {
                let user = filteredObject(userRecord, 'in_.*|out_.*|@.*|password|^_');
                let email = user.email;
                let uuid = user.uuid;
                let role = user.role;
                let id = Base64.base64('User:' + uuid);
                let payload = {
                  email,
                  id,
                  role
                };
                let authenticate = authToken(payload);

                user.authenticate = authenticate;

                resolve(user);
              } else {
                reject();
              }
            })
            .catch((e) => {
              console.log(`orientdb error: ${e}`);
              reject();
            })
          })
          .catch((errors) => {
            console.log(errors);
            reject(errors);
          });
      } else {
        reject({});
      }
    });
  }

  forgotPassword(object) {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let email = object.email;

      db
      .getUser()
      .from(_class)
      .where({email})
      .limit(1)
      .transform((record) => {
        let user = new User ();
        return filteredObject(record, '@.*|rid', user);
      })
      .one()
      .then((record) => {
        let user = filteredObject(record, 'in_.*|out_.*|@.*|password|^_');
        let email = user.email;
        let uuid = user.uuid;
        let role = user.role;
        let id = Base64.base64('User:' + uuid);
        let payload = {
          email,
          id,
          role
        };
        let authenticate = authToken(payload);

        user.authenticate = authenticate;

        resolve(user);
      })
      .catch((e) => {
        reject();
      })
      .done();
    });
  }

  registerNotification(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      let validator = new SMTIValidator(object);

      validator
      .isNotification()
      .then(({notification}) => {
        let _notification = {};
        _notification[notification.notificationId] = notification.platform;
        db
        .let('registerNotification', (s) => {
          s
          .update('User')
          .put('_notification', _notification)
          .where({
            uuid: userId
          })
          .where(
            `_allow["${role}"] = ${roles.owner}`
          )
        })
        .commit()
        .return('$registerNotification')
        .one()
        .then((record) => {
          resolve(notification);
        })
        .catch((e) => {
          console.log(`orientdb error: ${e}`);
          reject();
        })
        .done();
      })
      .catch((errors) => {
        console.log(errors);
        reject(errors);
      });
    });
  }

  unregisterNotification(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      let validator = new SMTIValidator(object, true);

      validator
      .isNotification()
      .then(({notification}) => {
        db
        .let('unregisterNotification', (s) => {
          s
          .update('User')
          .remove('_notification', notification.notificationId)
          .where({
            uuid: userId
          })
          .where(
            `_allow["${role}"] = ${roles.owner}`
          )
        })
        .commit()
        .return('$unregisterNotification')
        .one()
        .then((record) => {
          resolve(notification);
        })
        .catch((e) => {
          console.log(`orientdb error: ${e}`);
          reject();
        })
        .done();
      })
      .catch((errors) => {
        console.log(errors);
        reject(errors);
      });
    });
  }

  _unregisterMultipleNotificationIds(notificationIds) {
    let index = 0;
    let count = notificationIds.length || 0;
    let db = this.db;
    function unregister(index) {
      if (index < count) {
        let notificationId = notificationIds[index];
        index++;
        db
        .update('User')
        .remove('_notification', notificationId)
        .scalar()
        .then(() => {
          unregister(index);
        })
        .catch((e) => {
          console.log(`orientdb error: ${e}`);
        });
      }
    }
    unregister(index);
  }

  getNotifiableFromProject() {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let userId = this.user.id;
      let db = this.db;
      let projectId = this.targetId;

      db
      .select('$profile[0].notification.keys() as notificationIds')
        .let('profile', (s) => {
          s
          .select('uuid as id, _notification as notification')
          .from((s) => {
            s
            .select('expand(out[@class = "User"])')
            .from('$parent.$current')
            .limit(1)
          })
          .limit(1)
        })
      .inCollaboratesOnFromNode(projectId)
      .where(
        `not ( $profile[0].id = "${userId}" ) and $profile[0].notification IS NOT NULL`
      )
      .skip(0)
      .limit(30)
      .all()
      .then((notifications) => {
        resolve({
          notifications
        });
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      db.delete('VERTEX', _class)
      .where({
        uuid: targetId
      })
      .where(
        `_allow["${role}"] = ${roles.owner}`
      )
      .one()
      .then((result) => {
        if (result > 0) {
          resolve({success: true});
        } else {
          reject();
        }
      })
      .catch((e) => {
        console.log(e);
        reject();
      })
      .done();
    });
  }

  getEdgeCollaborators(args) {
    let pageObject = Pagination.getAscOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let userId = this.user.id;
      let db = this.db;
      let id = this.targetId;

      db
      .getCollaborator()
      .inCollaboratesOnFromNode(id)
      .where(
        `not ( $profile[0].id = "${userId}" )`
      )
      .where(
        pageObject.where
      )
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        let node = filteredObject(record, '@.*|rid');
        return {
          node,
          cursor: node.createdAt,
        };
      })
      .all()
      .then((edges) => {
        let payload = GraphQLHelper.connectionFromDbArray({edges, args});
        resolve(payload);
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  getEdgeInvitees(args) {
    let pageObject = Pagination.getAscOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let userId = this.user.id;
      let db = this.db;
      let id = this.targetId;

      db
      .getInvitee()
      .outInvitesOnFromNode(id)
      .where(
        pageObject.where
      )
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        let node = filteredObject(record, '@.*|rid');
        return {
          node,
          cursor: node.createdAt,
        };
      })
      .all()
      .then((edges) => {
        let payload = GraphQLHelper.connectionFromDbArray({edges, args});
        resolve(payload);
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }
}

export default UserDAO;
