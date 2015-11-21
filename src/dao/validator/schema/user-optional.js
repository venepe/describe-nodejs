'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
                .isObject()
                .withOptional('username', validator.isString({ regex: /^[.*]z{4, 32}$/ }))
                .withOptional('summary', validator.isString({ regex: /^[.*]z{0, 150}$/ }))
                .withOptional('fullName', validator.isString({ regex: /^[.*]z{0, 100}$/ }));

  validator.run(check, obj, (errorCount, errors) => callback);
}

module.exports = isValid;
