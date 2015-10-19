'use strict';

function isValidPassword(password) {
  var passwordRegex = '^(?=.*[^a-zA-Z])(?=.*[a-z])(?=.*[A-Z])\S{6,}$';
  var regEx = new RegExp(passwordRegex);
  return regEx.test(password);
}

module.exports = isValidPassword;
