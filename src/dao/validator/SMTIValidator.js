'use strict';

const uuid = require('node-uuid');
const validator = require('validator');
const utilities = require('../../utilities');

class SMTIValidator {
  constructor(obj, isOptional = false) {
    this.isOptional = isOptional;
    this.obj = obj;
  }

  isFile() {
    return new Promise((resolve, reject) => {
      let isOptional = this.isOptional;
      let obj = this.obj;
      let isValid;
      if (this.isOptional) {
        isValid = require('./schema/file.js');
      } else {
        isValid = require('./schema/file.js');
      }
      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          obj.id = uuid.v4();
          resolve(obj);
        } else {
          reject(errors);
        }
      });
    });
  }

  isProject() {
    return new Promise((resolve, reject) => {
      let isOptional = this.isOptional;
      let obj = this.obj;
      let isValid;
      if (isOptional) {
        isValid = require('./schema/project-optional.js');
      } else {
        isValid = require('./schema/project.js');
      }
      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          if (!isOptional) {
            obj.id = uuid.v4();
          }
          resolve(obj);
        } else {
          reject(errors);
        }
      });
    });
  }

  isTestCase() {
    return new Promise((resolve, reject) => {
      let isOptional = this.isOptional;
      let obj = this.obj;
      let isValid;
      if (isOptional) {
        isValid = require('./schema/test-case-optional.js');
      } else {
        isValid = require('./schema/test-case.js');
      }
      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          if (!isOptional) {
            obj.id = uuid.v4();
          }
          resolve(obj);
        } else {
          reject(errors);
        }
      });
    });
  }

  isUser() {
    return new Promise((resolve, reject) => {
      let isOptional = this.isOptional;
      let obj = this.obj;
      let isValid;
      if (isOptional) {
        isValid = require('./schema/user-optional.js');
      } else {
        isValid = require('./schema/user.js');
      }
      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          if (!isOptional) {
            obj.id = uuid.v4();
            obj.email = validator.normalizeEmail(obj.email);
            if (!obj.username || obj.username.length === 0) {
              obj.username = utilities.Generate.getUsername();
            }
          }
          resolve(obj);
        } else {
          reject(errors);
        }
      });
    });
  }

  isCredential() {
    return new Promise((resolve, reject) => {
      let obj = this.obj;
      let isValid = require('./schema/credential.js');

      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          resolve(obj);
        } else {
          reject(errors);
        }
      });
    });
  }

  isPassword() {
    return new Promise((resolve, reject) => {
      let obj = this.obj;
      let isValid = require('./schema/password.js');

      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          resolve(this.obj);
        } else {
          reject(errors);
        }
      });
    });
  }

  isReset() {
    return new Promise((resolve, reject) => {
      let obj = this.obj;
      let isValid = require('./schema/reset.js');

      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          resolve(this.obj);
        } else {
          reject(errors);
        }
      });
    });
  }
}

module.exports = SMTIValidator;
