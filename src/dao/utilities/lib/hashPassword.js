'use strict';

var CryptoJS = require('crypto-js');
var app_config = require('../../../config/');

import {
  AppConfig
} from '../../../config'

function hashPassword(password) {
  var salt = AppConfig.PasswordSalt;
  var hashedPassword = CryptoJS.MD5(password + salt);
  return hashedPassword.toString();
}

module.exports = hashPassword;
