'use strict';

export const ensureHttps = (req, res, next) => {
  if(req.secure){
    return next();
  };
  res.redirect('https://'+req.host+req.url);
};
