'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const jwt = require('express-jwt');
const jwtRefreshToken = require('jwt-refresh-token');
import {AppConfig, FileConfig} from './src/config';
const dao = require('./src/dao');
const uuid = require('node-uuid');
import {graphql} from 'graphql';
import {fromGlobalId} from 'graphql-relay';
const schema = require('./src/graphql/schema');
const multer  = require('multer');
const signup = require('./src/auth/signup');
const authenticate = require('./src/auth/authenticate');
const passwordReset = require('./src/auth/password-reset');
const upload = multer({ dest: __dirname + FileConfig.TempDir});
const port = process.env.PORT || 8000;
const baseUrl = process.env.BASE_URL;
const fs = require('fs');
const mmm = require('mmmagic');
const del = require('del');
const mv = require('mv');
const Magic = mmm.Magic;

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
  res.sendFile(__dirname + '/public/uploads/images/thumbnail/shaded.png');
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
  })
});

app.post('/forgot', bodyParser.json(), function(req, res) {
  let forgot = req.body.forgot || {};
  console.log('send email');
  res.status(200).json({forgot: null});
});

app.post('/reset', bodyParser.json(), function(req, res) {
  let reset = req.body.reset || {};
  console.log('hard reset password');
  res.status(200).json({reset: null});
});

app.post('/graphql', upload.single('0'), function(req, res, next){
    if (req.body && req.file && req.body.variables) {
      let variables = JSON.parse(req.body.variables);
      let filename = req.file.filename;
      let destination = req.file.destination;
      let filePath = destination + filename;
      let finalFilePath = filePath.replace(FileConfig.TempDir, FileConfig.UploadDir);
      console.log(finalFilePath);
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
              let errors = [{message: 'Error on upload.'}];
              res.status(400).json({errors});
            } else {
              let input = variables.input || variables.input_0;
              input.uri = finalFilePath.replace(__dirname + '/public' , baseUrl);
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
