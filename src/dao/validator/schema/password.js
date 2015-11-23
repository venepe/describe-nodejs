'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
                .isObject()
                .withRequired('current', validator.isString({ regex: /^.{6,32}$/ }))
                .withRequired('new', validator.isString({ regex: /^.{6,32}$/ }));

  validator.run(check, obj, callback);
}

module.exports = isValid;
