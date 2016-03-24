'use strict';

const getMeta = (pageObject, payload) => {
  let sliceStart = pageObject.skip;
  let arrayLength = sliceStart + payload.length;
  return {
    sliceStart,
    arrayLength
  };
}

const GraphQLHelper = {
  getMeta
}

export default GraphQLHelper;
