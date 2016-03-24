'use strict';

const getPasswordPattern = () => {
  // return /^(?=.*[^a-zA-Z])(?=.*[a-z])(?=.*[A-Z])\S{6,}$/;
  return /.*/;
}

const getUUIDPattern = () => {
  return /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/;
}

const Constants = {
  getPasswordPattern,
  getUUIDPattern
}

export default Constants;
