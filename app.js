'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');
const bodyParser = require('body-parser')
const app = express();
const server = require('http').Server(app);
const jwt = require('express-jwt');
const jwtRefreshToken = require('jwt-refresh-token');
import {AppConfig} from './src/config';
const dao = require('./src/dao');
const uuid = require('node-uuid');
const baseUrl = 'http://localhost:3000';
import {graphql} from 'graphql';
import {fromGlobalId} from 'graphql-relay';
const schema = require('./src/graphql/schema');
const multer  = require('multer');
const signup = require('./src/auth/signup');
const authenticate = require('./src/auth/authenticate');
const passwordReset = require('./src/auth/password-reset');
const upload = multer({ dest: __dirname + '/public/uploads/images/full_size/' });

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
  var authBody = req.body.authenticate || {};
  authenticate(authBody)
  .then(function(auth) {
    res.status(200).json({authenticate: auth});
  })
  .catch(function(err) {
    var errors = [{message: 'Invalid email or password.'}]
    res.status(400).json({errors});
  })
});

app.get('/default/images/:id', function(req, res) {
  res.sendFile(__dirname + '/public/uploads/images/thumbnail/shaded.png');
});

app.post('/token', function(req, res) {
  var token = req.headers['x-access-token'] || {};
  try {
    var newToken = jwtRefreshToken.refresh(token, AppConfig.JWTSecret, {});
    res.status(200).json({token: newToken});
  } catch (e) {
    var errors = [{message: 'Invalid token.'}]
    res.status(401).json({errors});

  }
});

app.post('/register', bodyParser.json(), function(req, res) {
  var user = req.body.register || {};
  signup(user)
  .then(function(user) {
    var authenticate = user.authenticate;
    res.status(200).json({register: authenticate});
  })
  .catch(function(err) {
    var errors = [{message: 'Invalid email or password.'}]
    res.status(400).json({errors});
  })
});

app.post('/password', bodyParser.json(), function(req, res) {
  var password = req.body.password || {};
  var user = req.user;
  passwordReset(user, password)
  .then(function(user) {
    var authenticate = user.authenticate || {};
    res.status(200).json({password: authenticate});
  })
  .catch(function(err) {
    var errors = [{message: 'Invalid password.'}]
    res.status(400).json({errors});
  })
});

app.post('/forgot', bodyParser.json(), function(req, res) {
  var forgot = req.body.forgot || {};
  console.log('send email');
  res.status(200).json({forgot: null});
});

app.post('/graphql', upload.single('image'), function(req, res, next){
    if (req.body && req.file && req.body.variables) {
      var variables = JSON.parse(req.body.variables);
      var filename = req.file.filename;
      var url = req.file.destination.replace(__dirname + '/public' , baseUrl);
      variables.input.uri = url + filename;
      variables = JSON.stringify(variables);
      req.body.variables = variables;
    }
    next();
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

app.use('/graphql', graphqlHTTP(request => ({
  schema: schema,
  rootValue: {user: request.user}
})));

server.listen(3000);
