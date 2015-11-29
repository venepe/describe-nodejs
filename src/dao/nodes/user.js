'use strict';

const _class = 'User';
const { SMTIValidator } = require('../validator');
const utilities = require('../../utilities');

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
      .where({id: id})
      .limit(1)
      .transform((record) => {
        let user = new User ();
        return utilities.FilteredObject(record, '@.*|rid', user);
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
        return utilities.FilteredObject(record, '@.*|rid');
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
            utilities.SMTICrypt.encrypt(object.password)
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

          db
          .create('vertex', 'User')
          .set(object)
          .set({_allow: [object.id]})
          .transform((record) => {
            return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|password|^_');
          })
          .one()
          .then((user) => {
            if(user) {
              let email = user.email;
              let uuid = user.id;
              let graphQLID = utilities.Base64.base64('User:' + uuid);
              let payload = {
                email: email,
                id: graphQLID,
                role: uuid
              };
              let authenticate = utilities.AuthToken(payload);

              user.authenticate = authenticate;

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
          .isUser(object)
          .then((object) => {
            db
            .let('update', (s) => {
              s
              .update(_class)
              .set(object)
              .where({id: targetId})
              .where(
                '_allow CONTAINS "' + role + '"'
              )
            })
            .let('user', (s) => {
              s
              .getUser()
              .from(_class)
              .where({id: targetId})
            })
            .commit()
            .return('$user')
            .transform((record) => {
              return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|password|^_');
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
                      id: targetId,
                    })
                    .limit(1)
                    .one();
          })
          .then((userRecord) => {
            return utilities.SMTICrypt.compare(object.current, userRecord.password);
          })
          .then(() => {
            return utilities.SMTICrypt.encrypt(object.new);
          })
          .then((newHash) => {
            db
            .update(_class)
            .set({
              password: newHash
            })
            .where({
              id: targetId
            })
            .where(
              '_allow CONTAINS "' + role + '"'
            )
            .scalar()
            .then((results) => {
              if (results > 0) {
                let user = utilities.FilteredObject(userRecord, 'in_.*|out_.*|@.*|password|^_');
                let email = user.email;
                let uuid = user.id;
                let graphQLID = utilities.Base64.base64('User:' + uuid);
                let payload = {
                  email: email,
                  id: graphQLID,
                  role: uuid
                };
                let authenticate = utilities.AuthToken(payload);

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
            return utilities.SMTICrypt.encrypt(object.password);
          })
          .then((newHash) => {
            db
            .update(_class)
            .set({
              password: newHash
            })
            .where({
              id: targetId
            })
            .where(
              '_allow CONTAINS "' + role + '"'
            )
            .scalar()
            .then((results) => {
              if (results > 0) {
                let user = utilities.FilteredObject(userRecord, 'in_.*|out_.*|@.*|password|^_');
                let email = user.email;
                let uuid = user.id;
                let graphQLID = utilities.Base64.base64('User:' + uuid);
                let payload = {
                  email: email,
                  id: graphQLID,
                  role: uuid
                };
                let authenticate = utilities.AuthToken(payload);

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
        return utilities.FilteredObject(record, '@.*|rid', user);
      })
      .one()
      .then((record) => {
        let user = utilities.FilteredObject(record, 'in_.*|out_.*|@.*|password|^_');
        let email = user.email;
        let uuid = user.id;
        let graphQLID = utilities.Base64.base64('User:' + uuid);
        let payload = {
          email: email,
          id: graphQLID,
          role: uuid
        };
        let authenticate = utilities.AuthToken(payload);

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
        id: targetId
      })
      .where(
        '_allow CONTAINS "' + role + '"'
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
}

export default UserDAO;
