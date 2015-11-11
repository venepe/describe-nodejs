'use strict';

const _class = 'User';
const validator = require('../validator');
const utilities = require('../utilities');

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
      .done(() => {
        // db.close();
      });
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
      .done(() => {
        // db.close();
      });
    });
  }

  create(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;

      validator.Validate(object).isUser(function(err, object) {
        if (err.valid === true) {

          let password = object.password;
          password = utilities.HashPassword(password);
          object.password = password;

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
              let username = user.username;
              let uuid = user.id;
              let graphQLID = utilities.Base64.base64('User:' + uuid);
              let payload = {
                username: username,
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
            console.log(e);
            reject();
          })
          .done(() => {
            // db.close();
          });
        } else {
          reject(err);
        }
      });
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
        validator.Validate(object, true).isUser(function(err, object) {

          if (err.valid === true) {

            db
            .let('update', function(s) {
              s
              .update(_class)
              .set(object)
              .where({id: targetId})
              .where(
                '_allow CONTAINS "' + role + '"'
              )
            })
            .let('user', function(s) {
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
              console.log(e);
              reject();
            })
            .done(() => {
              // db.close();
            });
          } else {
            reject(err);
          }
        });
      } else {
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

      if (userId === targetId) {
        validator.Validate(object).isPassword(function(err, object) {

          if (err.valid === true) {
            let currentPassword = object.current;
            let newPassword = object.new;
            currentPassword = utilities.HashPassword(currentPassword);
            newPassword = utilities.HashPassword(newPassword);

            db
            .let('update', function(s) {
              s
              .update(_class)
              .set({
                password: newPassword
              })
              .where({
                id: targetId,
                password: currentPassword
              })
              .where(
                '_allow CONTAINS "' + role + '"'
              )
            })
            .let('user', function(s) {
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
            .then((user) => {
              if(user) {
                let username = user.username;
                let uuid = user.id;
                let graphQLID = utilities.Base64.base64('User:' + uuid);
                let payload = {
                  username: username,
                  id: graphQLID,
                  role: uuid
                };
                let authenticate = utilities.AuthToken(payload);

                user.authenticate = authenticate;

                resolve(user);
              } else {
                //did not create
                reject({});
              }
            })
            .catch((e) => {
              console.log(e);
              reject();
            })
            .done(() => {
              // db.close();
            });
          } else {
            reject(err);
          }
        });
      } else {
        reject({});
      }
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
      .then(() => {
        resolve({success: true});
      })
      .catch((e) => {
        console.log(e);
        reject();
      })
      .done(() => {
        // db.close();
      });
    });
  }
}

export default UserDAO;
