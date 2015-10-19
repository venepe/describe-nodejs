'use strict';

var Base64 = require('./base64');

var PREFIX = 'arrayconnection:';

function cursorToOffset(cursor) {
  return parseInt((0, Base64.unbase64)(cursor).substring(PREFIX.length), 10);
}

module.exports = cursorToOffset;
