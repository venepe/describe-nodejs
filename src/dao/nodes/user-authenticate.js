'use strict';

const _class = 'User';
const { SMTIValidator } = require('../validator');
const utilities = require('../../utilities');

class UserAuthenticateDAO {
  authenticate(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;

      let validator = new SMTIValidator(object);

      validator
        .isCredential()
        .then((object) => {
          let email = object.email;
          db
          .select('*')
          .from(_class)
          .where({
            email
          })
          .limit(1)
          .one()
          .then((record) => {
            let password = object.password;
            let hash = record.password;
            utilities.SMTICrypt.compare(password, hash)
              .then(() => {
                let email = record.email;
                let uuid = record.id;
                let graphQLID = utilities.Base64.base64('User:' + uuid);
                let payload = {
                  email: email,
                  id: graphQLID,
                  role: uuid
                };
                let authenticate = utilities.AuthToken(payload);
                authenticate.email = email;
                console.log(authenticate);
                resolve(authenticate);
              })
              .catch((e) => {
                reject({message: 'Invalid email or password'});
              });
          })
          .catch((e) => {
            console.log(`orientdb error: ${e}`);
            reject({message: 'Invalid email or password'});
          });
        })
        .catch((errors) => {
          reject(errors);
        });
    });
  }
}

export default UserAuthenticateDAO;
