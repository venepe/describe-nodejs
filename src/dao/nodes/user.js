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
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

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
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        return filteredObject(record, '@.*|rid');
      })
      .all()
      .then((payload) => {
        let meta = GraphQLHelper.getMeta(pageObject, payload);
        resolve({
          payload,
          meta
        });
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }
}

export default UserDAO;
