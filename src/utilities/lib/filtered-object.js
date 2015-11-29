'use strict';

const _ = require('lodash');

var filtered_object = function(obj, filter, object) {
  //'in_.*|out_.*|@.*' RegExp to remove in_ & out_ relations
  let regEx = new RegExp(filter);
  let newObject = object || {};

  // Statement bodies
  _.forEach(obj, function(n, key) {
    if (!regEx.test(key)) {
      newObject[key] = obj[key];
    }
  });
  return newObject;
}

module.exports = filtered_object;
