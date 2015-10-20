'use strict';

const OrientDB = require('../db');
import {OrientDbConfig} from '../config';
const server = OrientDB(OrientDbConfig);

function DAO(user) {
  if (!(this instanceof DAO)) return new DAO(user);
  this.user = user || {};
  this.db = server.use({
    name: 'sumseti',
    username: 'writer',
    password: 'writer'
  });
}

DAO.prototype.Image = function(targetId, params) {
  var Image = require('./nodes/image.js');
  var img = new Image(targetId, params);
  img.db = this.db;
  img.user = this.user;
  return img;
}

DAO.prototype.Me = function() {
  var Me = require('./nodes/me.js');
  var m = new Me();
  m.db = this.db;
  m.user = this.user;
  return m;
}

DAO.prototype.Paper = function(targetId, params) {
  var Paper = require('./nodes/paper.js');
  var ppr = new Paper(targetId, params);
  ppr.db = this.db;
  ppr.user = this.user;
  return ppr;
}

DAO.prototype.Project = function(targetId, params) {
  var Project = require('./nodes/project.js');
  var pjt = new Project(targetId, params);
  pjt.db = this.db;
  pjt.user = this.user;
  return pjt;
}

DAO.prototype.Search = function(query, params) {
  var Search = require('./nodes/search.js');
  var srch = new Search(query, params);
  srch.db = this.db;
  srch.user = this.user;
  return srch;
}

DAO.prototype.TestCase = function(targetId, params) {
  var TestCase = require('./nodes/test-case.js');
  var tc = new TestCase(targetId, params);
  tc.db = this.db;
  tc.user = this.user;
  return tc;
}

DAO.prototype.UserAuthenticate = function() {
  var UserAuthenticate = require('./nodes/user-authenticate.js')
  var userAuth = new UserAuthenticate();
  userAuth.db = this.db;
  return userAuth;
}

DAO.prototype.User = function(targetId, params) {
  var User = require('./nodes/user.js')
  var user = new User(targetId, params);
  user.db = this.db;
  user.user = this.user;;
  return user;
}

module.exports = DAO;
