'use strict';

import validator from 'node-validator';

const isValid = (obj = {}, callback) => {
  let check = validator
                .isObject()
                .withRequired('name', validator.isString({ regex: /^[a-zA-Z0-9_]{4,32}$/ }))
                .withOptional('summary', validator.isString({ regex: /^.{0,150}$/ }))
                .withOptional('fullName', validator.isString({ regex: /^.{0,100}$/ }));

  validator.run(check, obj, callback);
}

export default isValid;
