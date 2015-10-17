function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function getUsername() {
  return 'user' + randomInt(100000001, 999999999);
}

module.exports.getUsername = getUsername;
