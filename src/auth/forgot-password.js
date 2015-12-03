'use strict';

const dao = require('../dao');

function forgotPassword(payload) {
  return dao().User().forgotPassword(payload)
}

module.exports = forgotPassword;
