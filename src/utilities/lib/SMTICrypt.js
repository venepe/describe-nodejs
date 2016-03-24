'use strict';

import bcrypt from 'bcrypt';

const encrypt = (secret) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.log(`SMTICrypt encrypt error: ${err}`);
        reject()
      } else {
        bcrypt.hash(secret, salt, (err, hash) => {
          if (err) {
            console.log(`SMTICrypt encrypt error: ${err}`);
            reject();
          } else {
            resolve(hash);
          }
        });
      }
    });
  });
}

const compare = (secret, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(secret, hash, (err, res) => {
      if (err) {
        console.log(`SMTICrypt compare error: ${err}`);
        reject()
      } else {
        if (res === true) {
          resolve(true);
        } else {
          reject({error: 'Invalid'});
        }
      }
    });
  });
}

const SMTICrypt = {
  encrypt,
  compare
}

export default SMTICrypt;
