var schema = {
    type: 'object',
    code: 400,
    strict: true,
    properties: {
      it: {type: 'string', minLength: 2, maxLength: 150}
    }
};

module.exports = schema;
