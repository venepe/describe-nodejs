'use strict';

import Base64 from './base64';

const PREFIX = 'arrayconnection:';

export const cursorToOffset = (cursor) => {
  return parseInt((0, Base64.unbase64)(cursor).substring(PREFIX.length), 10);
}
