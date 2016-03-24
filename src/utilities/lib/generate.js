'use strict';

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

const getUsername = () => {
  return 'user' + randomInt(100000001, 999999999);
}

const Generate = {
  getUsername
}

export default Generate;
