var uuid = require('node-uuid');
var utilities = require('../../utilities');

function getSchema() {
  return {
    type: 'object',
    strict: true,
    properties: {
      id: {type: 'string', def: uuid.v4(), optional: false, pattern:utilities.Constants.getUUIDPattern()},
      // uri: { type: 'string', pattern: /\.(jpeg|jpg|png)$/i}
      uri: { type: 'string'}
    }
  }
}

module.exports = getSchema;
