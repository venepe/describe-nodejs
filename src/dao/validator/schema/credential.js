'use strict';

const validator = require('validator');
const utilities = require('../../utilities');

var schema = {
  type: 'object',
  code: 400,
  strict: true,
  properties: {
    email: {type: 'string', pattern: 'email', maxLength: 150, exec: function (schema, email) {
      return validator.normalizeEmail(email);
    }},
    password: {type: 'string', minLength: 6, maxLength: 32, pattern:utilities.Constants.getPasswordPattern()},
  }
};

module.exports = schema;
