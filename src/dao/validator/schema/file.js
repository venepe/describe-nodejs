'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
              .isObject()
              .withRequired('uri', validator.isString());

  validator.run(check, obj, callback);
}

module.exports = isValid;
