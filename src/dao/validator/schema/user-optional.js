var schema = {
    type: 'object',
    code: 400,
    strict: true,
    properties: {
      username: {type: 'string', minLength: 4, maxLength: 32, optional: true},
      fullName: {type: 'string', minLength: 1, maxLength: 100, optional: true},
      // email: {type: 'string', pattern: 'email', maxLength: 150, optional: true},
      summary: {type: 'string', maxLength: 500, optional: true}
    }
};

module.exports = schema;
