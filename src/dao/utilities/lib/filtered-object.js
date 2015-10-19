'use strict';

var _ = require('lodash');

var filtered_object = function(obj, filter, object) {
  //'in_.*|out_.*|@.*' RegExp to remove in_ & out_ relations
  var regEx = new RegExp(filter);
  var newObject = object || {};

  // Statement bodies
  _.forEach(obj, function(n, key) {
    if (!regEx.test(key)) {
      newObject[key] = obj[key];
    }
  });
  return newObject;
}

module.exports = filtered_object;
