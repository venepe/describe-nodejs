var moment = require('moment');
var jwt = require('jwt-simple');
import {AppConfig} from '../../../config';

var authToken = function(payload) {
  var object = payload;
  var expires = moment().add(7, 'days').valueOf();
  payload.expires = expires;

  var token = jwt.encode(payload, AppConfig.JWTSecret);
  payload.token = token;

  return payload;
}

module.exports = authToken;
