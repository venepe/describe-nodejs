'use strict';

export const isValidPassword = (password) => {
  let passwordRegex = '^(?=.*[^a-zA-Z])(?=.*[a-z])(?=.*[A-Z])\S{6,}$';
  let regEx = new RegExp(passwordRegex);
  return regEx.test(password);
}
