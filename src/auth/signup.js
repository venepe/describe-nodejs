'use strict';

import DAO from '../dao';

export const signUp = (user) => {
  return new DAO().User().create(user)
}
