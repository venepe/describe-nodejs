'use strict';

function getPasswordPattern() {
  // return /^(?=.*[^a-zA-Z])(?=.*[a-z])(?=.*[A-Z])\S{6,}$/;
  return /.*/;
}

function getUUIDPattern() {
  return /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/;
}

module.exports.getPasswordPattern = getPasswordPattern;
module.exports.getUUIDPattern = getUUIDPattern;
