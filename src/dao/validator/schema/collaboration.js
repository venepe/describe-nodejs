'use strict';

const validator = require('node-validator');

function isValid(obj = {}, callback) {
  let check = validator
              .isObject()
              .withRequired('id', validator.isString({ regex: /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/ }));
              //.withRequired('name', validator.isString({ regex: /^.{4,32}$/ }));

  validator.run(check, obj, callback);
}

module.exports = isValid;
