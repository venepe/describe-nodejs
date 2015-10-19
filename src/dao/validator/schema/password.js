'use strict';

var validator = require('validator');
var utilities = require('../../utilities');

var schema = {
  type: 'object',
  code: 400,
  strict: true,
  properties: {
    current: {type: 'string', minLength: 6, maxLength: 32, pattern:utilities.Constants.getPasswordPattern()},
    new: {type: 'string', minLength: 6, maxLength: 32, pattern:utilities.Constants.getPasswordPattern()}
  }
};

module.exports = schema;
