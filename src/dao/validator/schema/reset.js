'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
                .isObject()
                .withRequired('password', validator.isString({ regex: /^.{6,32}$/ }))
                .withOptional('id', validator.isString());

  validator.run(check, obj, callback);
}

module.exports = isValid;
