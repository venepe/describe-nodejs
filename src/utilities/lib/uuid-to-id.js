'use strict';

export const uuidToId = (obj) => {
  obj.id = obj.uuid;
  delete obj.uuid;
  return obj;
}
