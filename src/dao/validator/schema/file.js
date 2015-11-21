'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
              .isObject()
              .withRequired('uri', validator.isString());

  validator.run(check, obj, (errorCount, errors) => callback);
}

module.exports = isValid;
