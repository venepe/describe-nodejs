'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
                .isObject()
                .withRequired('current', validator.isString({ regex: /^[.*]z{6, 32}$/ }))
                .withRequired('new', validator.isString({ regex: /^[.*]z{6, 32}$/ }));

  validator.run(check, obj, (errorCount, errors) => callback);
}

module.exports = isValid;
