'use strict';

const moment = require('moment');
const jwt = require('jwt-simple');
import {AppConfig} from '../../config';

var authToken = function(payload) {
  let object = payload;
  let expires = moment().add(7, 'days').valueOf();
  payload.expires = expires;

  let token = jwt.encode(payload, AppConfig.JWTSecret);
  payload.token = token;

  return payload;
}

module.exports = authToken;
