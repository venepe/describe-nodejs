'use strict';

var _class = 'User';
var validator = require('../validator');
var utilities = require('../utilities');

import {
  User
} from '../model'

function UserDAO(targetId, params) {
  // if (!(this instanceof User)) return new User(targetId);
  this.targetId = targetId;
  this.params = params;
}

UserDAO.prototype.get = function() {
  return new Promise((resolve, reject) => {
    var user = this.user;
    var db = this.db;
    var id = this.targetId;

    db
    .getUser()
    .from(_class)
    .where({id: id})
    .limit(1)
    .transform(function(record) {
      var user = new User ();
      return utilities.FilteredObject(record, '@.*|rid', user);
    })
    .one()
    .then(function (record) {
      resolve(record);
    })
    .catch(function (e) {
      reject();
    })
    .done(function() {
      // db.close();
    });
  });
}

UserDAO.prototype.inEdgeCreated = function () {
  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getUser()
    .inCreatesFromNode(id)
    .limit(25)
    .transform(function(record) {
      return utilities.FilteredObject(record, '@.*|rid');
    })
    .all()
    .then(function (records) {
      resolve(records);
    })
    .catch(function (e) {
      reject();

    })
    .done(function() {
    });
  });
}

UserDAO.prototype.create = function (object) {
  return new Promise((resolve, reject) => {
    var db = this.db;

    validator.Validate(object).isUser(function(err, object) {
      if (err.valid === true) {

        var password = object.password;
        password = utilities.HashPassword(password);
        object.password = password;

        db
        .create('vertex', 'User')
        .set(object)
        .set({_allow: [object.id]})
        .transform(function (record) {
          console.log(record);
          return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|password|^_');
        })
        .one()
        .then(function (user) {
          if(user) {
            var username = user.username;
            var uuid = user.id;
            var graphQLID = utilities.Base64.base64('User:' + uuid);
            var payload = {
              username: username,
              id: graphQLID,
              role: uuid
            };
            var authenticate = utilities.AuthToken(payload);

            user.authenticate = authenticate;

            resolve(user);
          } else {
            //did not create
            reject({});
          }

        })
        .catch(function(e) {
          console.log(e);
          reject();
        })
        .done();
      } else {
        reject(err);
      }
    });
  });
}

UserDAO.prototype.update = function (object) {
  return new Promise((resolve, reject) => {
    var targetId = this.targetId;
    var db = this.db;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    if (userId === targetId) {
      validator.Validate(object, true).isUser(function(err, object) {

        if (err.valid === true) {
          console.log(object);
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
          .transform(function (record) {
            return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|password|^_');
          })
          .one()
          .then(function (record) {
            resolve(record);
          })
          .catch(function(e) {
            console.log(e);
            reject();
          })
          .done();
        } else {
          reject(err);
        }
      });
    } else {
      reject({});
    }
  });
};

UserDAO.prototype.updatePassword = function (object) {
  return new Promise((resolve, reject) => {
    var targetId = this.targetId;
    var db = this.db;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    if (userId === targetId) {
      validator.Validate(object).isPassword(function(err, object) {

        if (err.valid === true) {
          var currentPassword = object.current;
          var newPassword = object.new;
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
          .transform(function (record) {
            return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|password|^_');
          })
          .one()
          .then(function (user) {
            if(user) {
              var username = user.username;
              var uuid = user.id;
              var graphQLID = utilities.Base64.base64('User:' + uuid);
              var payload = {
                username: username,
                id: graphQLID,
                role: uuid
              };
              var authenticate = utilities.AuthToken(payload);

              user.authenticate = authenticate;

              console.log(user);

              resolve(user);
            } else {
              //did not create
              reject({});
            }
          })
          .catch(function(e) {
            console.log(e);
            reject();
          })
          .done();
        } else {
          reject(err);
        }
      });
    } else {
      reject({});
    }
  });
};

UserDAO.prototype.del = function (callback) {
  return new Promise((resolve, reject) => {
    var targetId = this.targetId;
    var db = this.db;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    db.delete('VERTEX', _class)
    .where({
      id: targetId
    })
    .where(
      '_allow CONTAINS "' + role + '"'
    )
    .one()
    .then(function () {
      resolve({success: true});
    })
    .catch(function(e) {
      console.log(e);
      reject();

    })
    .done();
  });
}

module.exports = UserDAO;
