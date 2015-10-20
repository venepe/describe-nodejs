'use strict';

const _class = 'User';
const validator = require('../validator');
const utilities = require('../utilities');

function UserAuthenticate() {
  // if (!(this instanceof UserAuthenticate)) return new UserAuthenticate();
}

UserAuthenticate.prototype.authenticate = function (object) {
  return new Promise((resolve, reject) => {
    let db = this.db;

    validator.Validate(object).isCredential(function(err, object) {
      if (err.valid === true) {
      	let email = object.email;
        let password = object.password;
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
        .then((record) => {
          let email = record.email;
          let username = record.username;
          let uuid = record.id;
          let graphQLID = utilities.Base64.base64('User:' + uuid);
          let payload = {
            username: username,
            id: graphQLID,
            role: uuid
          };
          let authenticate = utilities.AuthToken(payload);
          authenticate.email = email;
          console.log(authenticate);
          resolve(authenticate);

        })
        .catch(function (e) {
          console.log(e);
          reject({message: 'Invalid email or password'})
        })
        .done(() => {
          db.close();
        });
      } else {
        console.log(err);
        reject(err);
      }
    });
  });
}

module.exports = UserAuthenticate;
