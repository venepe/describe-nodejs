'use strict';

const dao = require('../dao');

function Authenticate(authenticate) {

  return dao().UserAuthenticate().authenticate(authenticate)
}

module.exports = Authenticate;
