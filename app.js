'use strict';

import LE from 'letsencrypt';
import http from 'http';
import https from 'https';
import SocketIO from 'socket.io';
import socketioJwt from 'socketio-jwt';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import jwtRefreshToken from 'jwt-refresh-token';
import { AppConfig, FileConfig } from './src/config';
import { graphql } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import client from './src/client';
import schema from './src/graphql/schema';
import { connect } from './socket';
import multer from 'multer';
import { authenticate, deletAccount, forgotPassword, passwordReset, passwordUpdate, signUp } from './src/auth';
import { registerNotification, unregisterNotification } from './src/notification';
import fs from 'fs';
import mmm from 'mmmagic';
import del from 'del';
import mv from 'mv';
import { SMTIEmailTemplate } from './src/utilities';
import nodemailer from 'nodemailer';
import AWS from 'aws-sdk';
AWS.config.region = 'us-west-2';

const app = express();
const upload = multer({ dest: __dirname + FileConfig.TempDir});
const port = process.env.PORT || 80;
const baseImageUrl = FileConfig.BaseImageUrl;
const Magic = mmm.Magic;
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_ACCOUNT,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

app.use(function(req, res, next) {
  if(!req.secure) {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

app.use(jwt({
  secret: AppConfig.JWTSecret,
  credentialsRequired: false,
  getToken: function fromHeaderOrQuerystring (req) {
    if (req.headers['x-smti-authorization']) {
      return req.headers['x-smti-authorization'];
    }
    return null;
  }
}));

app.use(function(req, res, next) {
  if (req.user) {
    //Get id from the graphql id
    try {
      req.user.id = fromGlobalId(req.user.id).id;
    } catch(e) {
      req.user = {};
    }
  }
  next();
})

app.post('/authenticate', bodyParser.json(), function(req, res) {
  let authBody = req.body.authenticate || {};
  authenticate(authBody)
  .then(function(auth) {
    res.status(200).json({authenticate: auth});
  })
  .catch(function(err) {
    let errors = [{message: 'Invalid email or password.'}]
    res.status(400).json({errors});
  })
});

app.get('/default/images/:id', function(req, res) {
  let id = req.params.id;
  if (id.match(/^[A-Za-z][A-Za-z0-9 -]*$/)) {
    res.redirect('https://s3-us-west-2.amazonaws.com/sumseti/default/images/shaded-primary.png');
  } else {
    res.redirect('https://s3-us-west-2.amazonaws.com/sumseti/default/images/shaded-accent.png');
  }
});

app.post('/token', function(req, res) {
  let token = req.headers['x-smti-authorization'] || {};
  try {
    let newToken = jwtRefreshToken.refresh(token, AppConfig.JWTSecret, {});
    res.status(200).json({token: newToken});
  } catch (e) {
    let errors = [{message: 'Invalid token.'}]
    res.status(401).json({errors});

  }
});

app.post('/register', bodyParser.json(), function(req, res) {
  let user = req.body.register || {};
  signUp(user)
  .then(function(user) {
    let authenticate = user.authenticate;
    res.status(200).json({register: authenticate});
  })
  .catch(function(err) {
    let errors = [{message: 'Invalid email or password.'}]
    res.status(400).json({errors});
  })
});

app.post('/unregister', bodyParser.json(), function(req, res) {
  let unregister = req.body.unregister || {};
  let userId = fromGlobalId(unregister.userId).id;
  let user = req.user;
  deletAccount(user, userId)
  .then(function(payload) {
    res.status(200).json({unregister: payload});
  })
  .catch(function(err) {
    let errors = [{message: 'Unable to delete'}]
    res.status(400).json({errors});
  })
});

app.post('/password', bodyParser.json(), function(req, res) {
  let password = req.body.password || {};
  let user = req.user;
  let userId = user.id;
  passwordUpdate(user, userId, password)
  .then(function() {
    res.status(200).json({password: {}});
  })
  .catch(function(err) {
    let errors = [{message: 'Invalid password.'}]
    res.status(400).json({errors});
  });
});

app.post('/forgot', bodyParser.json(), function(req, res) {
  let forgot = req.body.forgot || {};
  forgotPassword(forgot)
  .then(function(user) {
    // setup e-mail data with unicode symbols
    let authenticate = user.authenticate || {};
    let email = user.email;
    let html = SMTIEmailTemplate.forgotPasswordEmail(user);
    const mailOptions = {
        from: 'Sumseti <automated@sumseti.com>',
        to: email,
        subject: 'Reset Password',
        html
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if (error){
          console.log(error);
          res.status(400).json({errors: []});
        } else {
          res.status(200).json({forgot: null});
        }
    });
  })
  .catch(function(err) {
    let errors = [{message: 'Invalid email address.'}]
    res.status(400).json({errors});
  });
});

app.post('/reset', bodyParser.json(), function(req, res) {
  let reset = req.body.reset || {};
  let user = req.user;
  passwordReset(user, reset)
  .then(function(user) {
    let authenticate = user.authenticate || {};
    res.status(200).json({reset: authenticate});
  })
  .catch(function(err) {
    let errors = [{message: 'Invalid entry.'}]
    res.status(400).json({errors});
  });
});

app.post('/notification', bodyParser.json(), function(req, res) {
  let notification = req.body.notification || {};
  let user = req.user;
  let userId = user.id;
  registerNotification(user, userId, notification)
  .then(function(notification) {
    res.status(200).json({notification});
  })
  .catch(function(err) {
    let errors = [{message: 'Invalid email or password.'}]
    res.status(400).json({errors});
  })
});

app.delete('/notification/:notificationId', function(req, res) {
  let notificationId = req.params.notificationId;
  let user = req.user;
  let userId = user.id;
  unregisterNotification(user, userId, notificationId)
  .then(function(notification) {
    res.status(200).json({notification});
  })
  .catch(function(err) {
    let errors = [{message: 'Unable to delete'}]
    res.status(400).json({errors});
  })
});

app.post('/graphql', upload.single('0'), function(req, res, next){
    if (req.body && req.file && req.body.variables) {

      //Get graphql variables and, if file matches type, add the uri to the mutation
      let variables = JSON.parse(req.body.variables);
      let filename = req.file.filename;
      let destination = req.file.destination;
      let filePath = destination + filename;
      let finalFilePath = filePath.replace(FileConfig.TempDir, FileConfig.UploadDir);
      let magic = new Magic(mmm.MAGIC_MIME_TYPE);
      let re = /(jpeg|jpg|png)$/i;
      magic.detectFile(filePath, (err, result) => {
        if (err || !result.match(re)) {
          let errors = [{message: 'Invalid file type.'}];
          del([filePath])
            .then((paths) => {
              res.status(400).json({errors});
            })
            .catch(err => {
              res.status(400).json({errors});
            });
        } else {
          if (process.env.NODE_ENV === 'production') {
            let body = fs.createReadStream(filePath);
            let filename = 'default/images/shaded-accent.png';
            let s3obj = new AWS.S3({params: {Bucket: 'sumseti', Key: filename, ContentType: result, ACL: 'public-read'}});
            s3obj.upload({Body: body})
              .send((err, data) => {
                   if (err) {
                     console.log(`Failed to upload image to s3: ${err}`);
                     let errors = [{message: 'Error on upload.'}];
                     res.status(400).json({errors});
                   } else {
                     let input = variables.input || variables.input_0;
                     input.uri = data.Location;
                     variables.input = input;
                     variables = JSON.stringify(variables);
                     req.body.variables = variables;
                     next();
                   }
               });
          } else {
            mv(filePath, finalFilePath, function(err) {
              if (err) {
                console.log(`Failed to move image: ${filePath}`);
                let errors = [{message: 'Error on upload.'}];
                res.status(400).json({errors});
              } else {
                let input = variables.input || variables.input_0;
                input.uri = finalFilePath.replace(__dirname + '/public' , baseImageUrl);
                variables.input = input;
                variables = JSON.stringify(variables);
                req.body.variables = variables;
                next();
              }
            });
          }
        }
      });
    } else {
      next();
    }
});

app.use(client);

app.use(express.static(__dirname + '/public'));

app.use('/graphql', graphqlHTTP(request => ({
  schema: schema,
  rootValue: {user: request.user}
})));

app.use(function(err, req, res, next) {
  // logic
  res.status(500).json({});
});

const httpServer = http.createServer(app);

if (port === 80) {

  const config = {
    server: LE.productionServerUrl,
    configDir: __dirname + '/etc/letsencrypt',
    webrootPath: __dirname + '/public',
    privkeyPath: ':config/live/:hostname/privkey.pem',
    fullchainPath: ':config/live/:hostname/fullchain.pem',
    certPath: ':config/live/:hostname/cert.pem',
    chainPath: ':config/live/:hostname/chain.pem',
    debug: false
  };


  const handlers = {
    setChallenge: function (opts, hostname, key, val, cb) {},
    removeChallenge: function (opts, hostname, key, cb) {},
    getChallenge: function (opts, hostname, key, cb) {},
    agreeToTerms: function (tosUrl, cb) {}
  };


  const le = LE.create(config, handlers);
  le.register({
    domains: ['sumseti.com'],
    email: 'admin@sumseti.com',
    agreeTos: false
  }, function (err) {

    if (err) {
      console.error('[Error]: node-letsencrypt/examples/standalone');
      console.error(err.stack);
    } else {
      console.log('success');
    }
  });

  // your express configuration here

  const key  = fs.readFileSync('./etc/letsencrypt/live/sumseti.com/privkey.pem');
  const cert = fs.readFileSync('./etc/letsencrypt/live/sumseti.com/fullchain.pem');
  const ca = fs.readFileSync('./etc/letsencrypt/live/sumseti.com/chain.pem');
  const sslOptions = {key, cert, ca};
  const httpsServer = https.createServer(sslOptions, app);

  const IO = new SocketIO(httpsServer);
  IO.on('connect', socketioJwt.authorize({
    secret: process.env.JWT_SECRET,
    timeout: 15000
  })).on('authenticated', connect);

  httpServer.listen(80);
  httpsServer.listen(443);

} else {
  const IO = new SocketIO(httpServer);
  IO.on('connect', socketioJwt.authorize({
    secret: process.env.JWT_SECRET,
    timeout: 15000
  })).on('authenticated', connect);

  httpServer.listen(port);

}
