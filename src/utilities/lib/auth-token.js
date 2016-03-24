'use strict';

import moment from 'moment';
import jwt from 'jwt-simple';
import { AppConfig } from '../../config';

export const authToken = (payload) => {
  let object = payload;
  let expires = moment().add(7, 'days').valueOf();
  payload.expires = expires;

  let token = jwt.encode(payload, AppConfig.JWTSecret);
  payload.token = token;

  return payload;
}
