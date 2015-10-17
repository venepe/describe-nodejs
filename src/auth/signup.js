var dao = require('../dao');

function SignUp(user) {
  
  return dao().User().create(user)
}

module.exports = SignUp;
