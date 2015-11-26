'use strict';

const dao = require('../dao');

function ForgotPassword(payload) {
  return dao().User().forgotPassword(payload)
}

module.exports = ForgotPassword;
