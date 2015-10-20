'use strict';

const uuid = require('node-uuid');
const utilities = require('../../utilities');

function getSchema() {
  return {
    type: 'object',
    code: 400,
    strict: true,
    properties: {
      id: {type: 'string', def: uuid.v4(), optional: false, pattern:utilities.Constants.getUUIDPattern()},
      title: {type: 'string', minLength: 2, maxLength: 150}
    }
  }
}

module.exports = getSchema;
