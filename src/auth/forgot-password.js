'use strict';

import DAO from '../dao';

function forgotPassword(payload) {
  return new DAO().User().forgotPassword(payload)
}

module.exports = forgotPassword;
