'use strict';

var exports = module.exports;

var _class = 'TestCase';
var validator = require('../validator');
var utilites = require('../utilities');

import {
  TestCase
} from '../model'

function TestCaseDAO(targetId, params) {
  // if (!(this instanceof TestCase)) return new TestCase(targetId);
  this.targetId = targetId;
  this.params = params;
}

TestCaseDAO.prototype.get = function () {
  return new Promise((resolve, reject) => {
    var user = this.user;
    var db = this.db;
    var id = this.targetId;

    db
    .getTestCase()
    .from(_class)
    .where({id: id})
    .limit(1)
    .transform(function(record) {
      var testCase = new TestCase();
      return utilites.FilteredObject(record, '@.*|rid', testCase);
    })
    .one()
    .then(function (record) {
      resolve(record);
    })
    .catch(function (e) {
      reject();

    })
    .done(function() {
      // db.close();
    });
  });
}

TestCaseDAO.prototype.getEdgeCreated = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getTestCase()
    .outCreatesFromNode(id)
    .skip(pageObject.skip)
    .limit(pageObject.limit)
    .order(pageObject.orderBy)
    .transform(function(record) {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .all()
    .then(function (records) {
      resolve(records);
    })
    .catch(function (e) {
      reject();

    })
    .done(function() {
      // db.close();
    });
  });
}

TestCaseDAO.prototype.getEdgeRequired = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getTestCase()
    .outRequiresFromNode(id)
    .skip(pageObject.skip)
    .limit(pageObject.limit)
    .order(pageObject.orderBy)
    .transform(function(record) {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .all()
    .then(function (records) {
      resolve(records);
    })
    .catch(function (e) {
      reject();

    })
    .done(function() {
      // db.close();
    });
  });
}

TestCaseDAO.prototype.getEdgeTargeted = function () {
  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getTestCase()
    .outTargetsRequiresFromNode(id)
    .transform(function(record) {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .all()
    .then(function (records) {
      resolve(records);
    })
    .catch(function (e) {
      reject();

    })
    .done(function() {
      // db.close();
    });
  });
}

TestCaseDAO.prototype.create = function (object) {
  return new Promise((resolve, reject) => {
    var db = this.db;
    var relationalId = this.targetId;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    validator.Validate(object).isTestCase(function(err, object) {

      if (err.valid === true) {

        db
        .let('project', function (s) {
          s
          .select()
          .from('Project')
          .where({
            id: relationalId
          })
          .where(
            '_allow CONTAINS "' + role + '"'
          )
        })
        .let('user', function (s) {
          s
          .select()
          .from('User')
          .where({
            id: userId
          })
          .where(
            '_allow CONTAINS "' + role + '"'
          )
        })
        .let('testCase', function(s) {
          s
          .create('vertex', 'TestCase')
          .set(object)
          .set({_allow: [role]})
        })
        .let('creates', function (s) {
          s
          .create('edge', 'Creates')
          .from('$user')
          .to('$testCase')
        })
        .let('requires', function (s) {
          s
          .create('edge', 'Requires')
          .from('$project')
          .to('$testCase')
        })
        .commit()
        .return('$testCase')
        .transform(function(record) {
          console.log(record);
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then(function (result) {
          resolve(result);
        })
        .catch(function (e) {
          console.log(e);
          console.log('we have an eror');
          reject();

        })
        .done();

      } else {
        reject(err);
      }
    });
  });
}

TestCaseDAO.prototype.update = function (object) {
  return new Promise((resolve, reject) => {
    var targetId = this.targetId;
    var db = this.db;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    validator.Validate(object, true).isTestCase(function(err, object) {

      if (err.valid === true) {

        db
        .let('testCase', function(s) {
          s
          .select()
          .from(_class)
          .where({
            id: targetId
          })
          .where(
            '_allow CONTAINS "' + role + '"'
          )
        })
        .let('update', function(s) {
          s
          .update('$testCase')
          .set(object)
        })
        .let('newTestCase', function(s) {
          s
          .getTestCase()
          .from('$testCase')
        })
        .commit()
        .return('$newTestCase')
        .transform(function (record) {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then(function (record) {
          resolve(record);
        })
        .catch(function(e) {
          console.log(e);
          reject();

        })
        .done();

      } else {
        reject(err);
      }

    });
  });
};

TestCaseDAO.prototype.del = function () {
  console.log('delete');
  return new Promise((resolve, reject) => {
    var targetId = this.targetId;
    var db = this.db;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    db.delete('VERTEX', _class)
    .where({
      id: targetId
    })
    .where(
      '_allow CONTAINS "' + role + '"'
    )
    .one()
    .then(function() {
      resolve({success: true});
    })
    .catch(function(e) {
      console.log(e);
      reject();

    })
    .done();
  });
}

module.exports = TestCaseDAO;
