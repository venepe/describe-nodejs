'use strict';

const OrientDB = require('../db');
import { OrientDbConfig, SumsetiDbConfig } from '../config';
const server = OrientDB(OrientDbConfig);

function DAO(user) {
  if (!(this instanceof DAO)) return new DAO(user);
  this.user = user || {};
  this.db = server.use(SumsetiDbConfig);
}

DAO.prototype.File = function(targetId, params) {
  let File = require('./nodes/file.js');
  let fl = new File(targetId, params);
  fl.db = this.db;
  fl.user = this.user;
  return fl;
}

DAO.prototype.Cover = function(targetId, params) {
  let Cover = require('./edges/cover.js');
  let cv = new Cover(targetId, params);
  cv.db = this.db;
  cv.user = this.user;
  return cv;
}

DAO.prototype.Example = function(targetId, params) {
  let Example = require('./edges/example.js');
  let ex = new Example(targetId, params);
  ex.db = this.db;
  ex.user = this.user;
  return ex;
}

DAO.prototype.Fulfillment = function(targetId, params) {
  let Fulfillment = require('./edges/fulfillment.js');
  let ful = new Fulfillment(targetId, params);
  ful.db = this.db;
  ful.user = this.user;
  return ful;
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
