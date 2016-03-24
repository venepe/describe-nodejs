'use strict';

import uuid from 'node-uuid';
import validator from 'validator';
import { Generate } from '../../utilities'
import * as schema from './schema';

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
        isValid = schema.isValidFile;
      } else {
        isValid = schema.isValidFile;
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
        isValid = schema.isValidProjectOptional;
      } else {
        isValid = schema.isValidProject;
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
        isValid = schema.isValidTestCaseOptional;
      } else {
        isValid = schema.isValidTestCase;
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
        isValid = schema.isValidUserOptional;
      } else {
        isValid = schema.isValidUser;
      }
      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          if (!isOptional) {
            obj.id = uuid.v4();
            obj.email = validator.normalizeEmail(obj.email);
            if (!obj.name || obj.name.length === 0) {
              obj.name = Generate.getUsername();
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
      let isValid = schema.isValidCredential;

      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          obj.email = validator.normalizeEmail(obj.email);
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
      let isValid = schema.isValidPassword;

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
      let isValid = schema.isValidReset;

      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          resolve(this.obj);
        } else {
          reject(errors);
        }
      });
    });
  }

  isCollaborator() {
    return new Promise((resolve, reject) => {
      let obj = this.obj;
      let isValid = schema.isValidCollaboration;

      isValid(obj, (errorCount, errors) => {
        if (errorCount === 0) {
          obj.email = validator.normalizeEmail(obj.email);
          resolve(obj);
        } else {
          reject(errors);
        }
      });
    });
  }
}

export default SMTIValidator;
