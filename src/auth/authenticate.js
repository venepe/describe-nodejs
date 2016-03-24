'use strict';

import DAO from '../dao';

export const authenticate = (authenticate) => {
  return new DAO().UserAuthenticate().authenticate(authenticate)
}
