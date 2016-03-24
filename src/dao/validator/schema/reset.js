'use strict';

import validator from 'node-validator';

const isValid = (obj = {}, callback) => {
  let check = validator
                .isObject()
                .withRequired('password', validator.isString({ regex: /^.{6,32}$/ }))
                .withOptional('id', validator.isString());

  validator.run(check, obj, callback);
}

export default isValid;
