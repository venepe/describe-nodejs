'use strict';

var _class = 'User';
var validator = require('../validator');
var utilities = require('../utilities');

function UserAuthenticate() {
  if (!(this instanceof UserAuthenticate)) return new UserAuthenticate();
}

UserAuthenticate.prototype.authenticate = function (object) {
  return new Promise((resolve, reject) => {
    var db = this.db;

    validator.Validate(object).isCredential(function(err, object) {
      if (err.valid === true) {
      	var email = object.email;
        var password = object.password;
      	password = utilities.HashPassword(password);

        db
        .select('*')
        .from(_class)
        .where({
          email: email,
          password: password
        })
        .limit(1)
        .one()
        .then(function (record) {
          var email = record.email;
          var username = record.username;
          var uuid = record.id;
          var graphQLID = utilities.Base64.base64('User:' + uuid);
          var payload = {
            username: username,
            id: graphQLID,
            role: uuid
          };
          var authenticate = utilities.AuthToken(payload);
          authenticate.email = email;
          console.log(authenticate);
          resolve(authenticate);

        })
        .catch(function (e) {
          console.log(e);
          reject({message: 'Invalid email or password'})

        });
      } else {
        console.log(err);
        console.log('did fail validation');
        reject(err);
      }
    });
  });
}

module.exports = UserAuthenticate;
