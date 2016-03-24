'use strict';

import _ from 'lodash';

export const filteredObject = (obj, filter, object) => {
  //'in_.*|out_.*|@.*' RegExp to remove in_ & out_ relations
  let regEx = new RegExp(filter);
  let newObject = object || {};

  // Statement bodies
  _.forEach(obj, (n, key) => {
    if (!regEx.test(key)) {
      newObject[key] = obj[key];
    }
  });
  return newObject;
}
