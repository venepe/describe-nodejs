'use strict';

function ensureHttps(req, res, next){
  if(req.secure){
    return next();
  };
  res.redirect('https://'+req.host+req.url);
};

module.exports = ensureHttps;
