'use strict';

const uuid = require('node-uuid');
const utilities = require('../../utilities');
const validator = require('validator');

function getSchema() {
  return {
    type: 'object',
    code: 400,
    strict: true,
    properties: {
      id: {type: 'string', def: uuid.v4(), optional: false, pattern:utilities.Constants.getUUIDPattern()},
      email: {type: 'string', pattern: 'email', maxLength: 150, exec: function (schema, email) {
        return validator.normalizeEmail(email);
      }},
      username: {type: 'string', def: utilities.Generate.getUsername(), minLength: 4, maxLength: 32, optional: false},
      password: {type: 'string', minLength: 6, maxLength: 32, pattern:utilities.Constants.getPasswordPattern()},
      fullName: {type: 'string', minLength: 1, maxLength: 100, optional: true},
      summary: {type: 'string', maxLength: 500, optional: true}
    }
  }
}

module.exports = getSchema;
