'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
              .isObject()
              .withRequired('it', validator.isString({ regex: /^[.*]z{2, 150}$/ }));

  validator.run(check, obj, (errorCount, errors) => callback);
}

module.exports = isValid;
