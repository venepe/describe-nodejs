'use strict';

const bcrypt = require('bcrypt');

function encrypt(secret) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        console.log(`SMTICrypt encrypt error: ${err}`);
        reject()
      } else {
        bcrypt.hash(secret, salt, function(err, hash) {
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

function compare(secret, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(secret, hash, function(err, res) {
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

module.exports.encrypt = encrypt;
module.exports.compare = compare;
