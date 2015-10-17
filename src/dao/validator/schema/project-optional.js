var schema = {
    type: 'object',
    code: 400,
    strict: true,
    properties: {
      title: {type: 'string', minLength: 2, maxLength: 150, optional: true}
    }
};

module.exports = schema;
