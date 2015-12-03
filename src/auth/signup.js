'use strict';

const dao = require('../dao');

function signUp(user) {
  return dao().User().create(user)
}

module.exports = signUp;
