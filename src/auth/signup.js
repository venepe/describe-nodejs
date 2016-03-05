'use strict';

import DAO from '../dao';

function signUp(user) {
  return new DAO().User().create(user)
}

module.exports = signUp;
