'use strict';

var dao = require('../dao');

function Authenticate(authenticate) {

  return dao().UserAuthenticate().authenticate(authenticate)
}

module.exports = Authenticate;
