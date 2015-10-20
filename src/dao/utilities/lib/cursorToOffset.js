'use strict';

const Base64 = require('./base64');

const PREFIX = 'arrayconnection:';

function cursorToOffset(cursor) {
  return parseInt((0, Base64.unbase64)(cursor).substring(PREFIX.length), 10);
}

module.exports = cursorToOffset;
