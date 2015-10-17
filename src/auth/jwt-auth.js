var exports = module.exports;
var jwt = require('jwt-simple');
import {AppConfig} from '../config';
module.exports = function(socket, next) {
  var token = socket.request.headers["x-access-token"];
  if (token) {
    try {
      var decoded = jwt.decode(token, AppConfig.JWTSecret;
      if (decoded.exp <= Date.now()) {
        return next();
      } else {
        socket.user = {
          id: decoded.id,
          role: decoded.role
        };
        return next();
      }
    } catch (err) {
      return next();
    }

  } else {
    return next();
  }
}
