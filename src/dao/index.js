'use strict';

const OrientDB = require('../db');
import {OrientDbConfig, SumsetiDbConfig} from '../config';
const server = OrientDB(OrientDbConfig);

function DAO(user) {
  if (!(this instanceof DAO)) return new DAO(user);
  this.user = user || {};
  this.db = server.use(SumsetiDbConfig);
}

DAO.prototype.Image = function(targetId, params) {
  let Image = require('./nodes/image.js');
  let img = new Image(targetId, params);
  img.db = this.db;
  img.user = this.user;
  return img;
}

DAO.prototype.Me = function() {
  let Me = require('./nodes/me.js');
  let m = new Me();
  m.db = this.db;
  m.user = this.user;
  return m;
}

DAO.prototype.Paper = function(targetId, params) {
  let Paper = require('./nodes/paper.js');
  let ppr = new Paper(targetId, params);
  ppr.db = this.db;
  ppr.user = this.user;
  return ppr;
}

DAO.prototype.Project = function(targetId, params) {
  let Project = require('./nodes/project.js');
  let pjt = new Project(targetId, params);
  pjt.db = this.db;
  pjt.user = this.user;
  return pjt;
}

DAO.prototype.Search = function(query, params) {
  let Search = require('./nodes/search.js');
  let srch = new Search(query, params);
  srch.db = this.db;
  srch.user = this.user;
  return srch;
}

DAO.prototype.TestCase = function(targetId, params) {
  let TestCase = require('./nodes/test-case.js');
  let tc = new TestCase(targetId, params);
  tc.db = this.db;
  tc.user = this.user;
  return tc;
}

DAO.prototype.UserAuthenticate = function() {
  let UserAuthenticate = require('./nodes/user-authenticate.js')
  let userAuth = new UserAuthenticate();
  userAuth.db = this.db;
  return userAuth;
}

DAO.prototype.User = function(targetId, params) {
  let User = require('./nodes/user.js')
  let user = new User(targetId, params);
  user.db = this.db;
  user.user = this.user;;
  return user;
}

module.exports = DAO;
