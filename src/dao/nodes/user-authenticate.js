'use strict';

const _class = 'User';
import { SMTIValidator } from '../validator';
import { authToken, filteredObject, SMTICrypt, Base64 } from '../../utilities';

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
          .then((user) => {
            let password = object.password;
            let hash = user.password;
            SMTICrypt.compare(password, hash)
              .then(() => {
                let email = user.email;
                let uuid = user.id;
                let role = user.role;
                let id = Base64.base64('User:' + uuid);
                let payload = {
                  email,
                  id,
                  role
                };
                let authenticate = authToken(payload);
                authenticate.email = email;
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
