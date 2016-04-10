'use strict';

import validator from 'node-validator';

const isValid = (obj = {}, callback) => {
  let check = validator
              .isObject()
              .withRequired('reason', validator.isString({ regex: /^.{1,150}$/ }));

  validator.run(check, obj, callback);
}

export default isValid;
