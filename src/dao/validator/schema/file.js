'use strict';

import validator from 'node-validator';

const isValid = (obj = {}, callback) => {
  let check = validator
              .isObject()
              .withRequired('uri', validator.isString());

  validator.run(check, obj, callback);
}

export default isValid;
