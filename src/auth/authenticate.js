'use strict';

import DAO from '../dao';

function authenticate(authenticate) {
  return new DAO().UserAuthenticate().authenticate(authenticate)
}

module.exports = authenticate;
