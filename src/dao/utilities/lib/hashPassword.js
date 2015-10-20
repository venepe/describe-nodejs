'use strict';

const CryptoJS = require('crypto-js');
const app_config = require('../../../config/');

import {
  AppConfig
} from '../../../config'

function hashPassword(password) {
  let salt = AppConfig.PasswordSalt;
  let hashedPassword = CryptoJS.MD5(password + salt);
  return hashedPassword.toString();
}

module.exports = hashPassword;
