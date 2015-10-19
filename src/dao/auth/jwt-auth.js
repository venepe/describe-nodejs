'use strict';

var exports = module.exports;
var jwt = require('jwt-simple');
import {AppConfig} from '../../config';

module.exports = function(token) {
  if (token) {
    try {
      var decoded = jwt.decode(token, AppConfig.JWTSecret);
      if (decoded.exp <= Date.now()) {
        return null;
      } else {
        var user = {
          id: decoded.id,
          role: decoded.role
        };
        return user;
      }
    } catch (err) {
      return null;
    }

  } else {
    return null;
  }
}
