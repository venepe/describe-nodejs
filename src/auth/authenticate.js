'use strict';

const dao = require('../dao');

function authenticate(authenticate) {
  return dao().UserAuthenticate().authenticate(authenticate)
}

module.exports = authenticate;
