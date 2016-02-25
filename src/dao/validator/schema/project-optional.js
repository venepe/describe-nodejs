'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
              .isObject()
              .withOptional('title', validator.isString({ regex: /^.{1,150}$/ }));

  validator.run(check, obj, callback);
}

module.exports = isValid;
