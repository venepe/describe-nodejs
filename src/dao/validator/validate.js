var inspector = require('schema-inspector');

var validateAndSanitize = function(schema, object) {
  var sanObject = inspector.sanitize(schema, object);
  var result = inspector.validate(schema, object);
  return {result: result, object: object};
}

var validate = function(object, isOptional) {
  this.object = object;
  isOptional = isOptional || false;

  this.isImage = function(callback) {
    var schema;
    var result;
    if (isOptional) {
      schema = require('./schema/image-optional.js');
    } else {
      schema = require('./schema/image.js')();
    }

    result = validateAndSanitize(schema, this.object);
    callback(result.result, result.object);
  };

  this.isPaper = function(callback) {
    var schema;
    var result;
    if (isOptional) {
      schema = require('./schema/paper-optional.js');
    } else {
      schema = require('./schema/paper.js')();
    }

    result = validateAndSanitize(schema, this.object);
    callback(result.result, result.object);
  };

  this.isProject = function(callback) {
    var schema;
    var result;
    if (isOptional) {
      schema = require('./schema/project-optional.js');
    } else {
      schema = require('./schema/project.js')();
    }

    result = validateAndSanitize(schema, this.object);
    callback(result.result, result.object);
  };

  this.isTestCase = function(callback) {
    var schema;
    var result;
    if (isOptional) {
      schema = require('./schema/test-case-optional.js');
    } else {
      schema = require('./schema/test-case.js')();
    }
    result = validateAndSanitize(schema, this.object);

    callback(result.result, result.object);
  };

  this.isUser = function(callback) {
    var schema;
    var result;
    if (isOptional) {
      schema = require('./schema/user-optional.js');
    } else {
      schema = require('./schema/user.js')();
    }

    result = validateAndSanitize(schema, this.object);
    callback(result.result, result.object);
  };

  this.isCredential = function(callback) {
    var schema = require('./schema/credential.js');
    var result = validateAndSanitize(schema, this.object);
    callback(result.result, result.object);
  };

  this.isPassword = function(callback) {
    var schema = require('./schema/password.js');
    var result = validateAndSanitize(schema, this.object);
    callback(result.result, result.object);
  };

  return this;
};

module.exports = validate;
