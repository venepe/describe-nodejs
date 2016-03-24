'use strict';

import DAO from '../dao';

export const forgotPassword = (payload) => {
  return new DAO().User().forgotPassword(payload)
}
