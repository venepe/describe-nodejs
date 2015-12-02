'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const jwt = require('express-jwt');
const jwtRefreshToken = require('jwt-refresh-token');
import {AppConfig, FileConfig} from './src/config';
import {graphql} from 'graphql';
import {fromGlobalId} from 'graphql-relay';
const schema = require('./src/graphql/schema');
const multer  = require('multer');
const signup = require('./src/auth/signup');
const deletAccount = require('./src/auth/delete-account');
const forgotPassword = require('./src/auth/forgot-password');
const authenticate = require('./src/auth/authenticate');
const passwordReset = require('./src/auth/password-reset');
const upload = multer({ dest: __dirname + FileConfig.TempDir});
const port = process.env.PORT || 8000;
const baseImageUrl = FileConfig.BaseImageUrl;
const fs = require('fs');
const mmm = require('mmmagic');
const del = require('del');
const mv = require('mv');
const Magic = mmm.Magic;
import {SMTIEmailTemplate} from './src/utilities';
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_ACCOUNT,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

app.use(jwt({
  secret: AppConfig.JWTSecret,
  credentialsRequired: false,
  getToken: function fromHeaderOrQuerystring (req) {
    if (req.headers['x-access-token']) {
      return req.headers['x-access-token'];
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
    res.sendFile(__dirname + '/public/uploads/images/thumbnail/shaded-primary.png');
  } else {
    res.sendFile(__dirname + '/public/uploads/images/thumbnail/shaded-accent.png');
  }
});

app.post('/token', function(req, res) {
  let token = req.headers['x-access-token'] || {};
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
  signup(user)
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
  passwordReset(user, password)
  .then(function(user) {
    let authenticate = user.authenticate || {};
    res.status(200).json({password: authenticate});
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
      });
    } else {
      next();
    }
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

app.use('/graphql', graphqlHTTP(request => ({
  schema: schema,
  rootValue: {user: request.user}
})));

app.use(function(err, req, res, next) {
  // logic
  res.status(500).json({});
});

server.listen(port);
