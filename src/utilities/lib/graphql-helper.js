'use strict';

function getMeta(pageObject, payload) {
  let sliceStart = pageObject.skip;
  let arrayLength = sliceStart + payload.length;
  return {
    sliceStart,
    arrayLength
  };
}

module.exports.getMeta = getMeta;
