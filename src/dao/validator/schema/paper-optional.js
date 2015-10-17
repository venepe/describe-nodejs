var schema = {
    type: 'object',
    code: 400,
    strict: true,
    properties: {
      text: {type: 'string', minLength: 2, maxLength: 500}
    }
};

module.exports = schema;
