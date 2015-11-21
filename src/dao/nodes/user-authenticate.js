'use strict';

const _class = 'User';
const { SMTIValidator } = require('../validator');
const utilities = require('../utilities');

class UserAuthenticateDAO {
  authenticate(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;

      let validator = new SMTIValidator(object);

      validator
        .isCredential()
        .then((object) => {
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
          .catch((e) => {
            console.log('orientdb error: ' + e);
            reject({message: 'Invalid email or password'})
          })
          .done();
        })
        .catch((errors) => {
          reject(errors);
        });
    });
  }
}

export default UserAuthenticateDAO;
