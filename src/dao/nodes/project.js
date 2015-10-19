'use strict';

var _class = 'Project';
var validator = require('../validator');
var utilites = require('../utilities');

import {
  Project
} from '../model'

function ProjectDAO(targetId, params) {
  // if (!(this instanceof ProjectDAO)) return new ProjectDAO(targetId);
  this.targetId = targetId;
  this.params = params;
}

ProjectDAO.prototype.get = function () {
  return new Promise((resolve, reject) => {
    var user = this.user;
    var db = this.db;
    var id = this.targetId;

  db
  .getProject()
  .from(_class)
  .where({id: id})
  .limit(1)
  .transform(function(record) {
    var project = new Project();
    return utilites.FilteredObject(record, '@.*|rid', project);
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

ProjectDAO.prototype.inEdgeRequired = function () {
  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getProject()
    .inRequiresFromNode(id)
    .limit(25)
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
    });
  });
}

ProjectDAO.prototype.inEdgeFulfilled = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getProject()
    .inFulfillsFromNode(id)
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
    });
  });
}

ProjectDAO.prototype.getEdgeCreated = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getProject()
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

ProjectDAO.prototype.create = function (object) {
  return new Promise((resolve, reject) => {
    var db = this.db;
    var relationalId = this.targetId;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    validator.Validate(object).isProject(function(err, object) {

      if (err.valid === true) {
        db
        .let('user', function (s) {
          s
          .select()
          .from('User')
          .where({
            id: relationalId
          })
          .where(
            '_allow CONTAINS "' + role + '"'
          )
        })
        .let('project', function(s) {
          s
          .create('vertex', 'Project')
          .set(object)
          .set({_allow: [role]})
        })
        .let('creates', function (s) {
          s
          .create('edge', 'Creates')
          .from('$user')
          .to('$project')
        })
        .commit()
        .return('$project')
        .transform(function(record) {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then(function (record) {
          record.testCases = [];
          resolve(record);
        })
        .catch(function (e) {
          reject();

        })
        .done();

      } else {
        reject(err);
      }
    });
  });
}

ProjectDAO.prototype.createFulfills = function (object) {
  return new Promise((resolve, reject) => {
    var db = this.db;
    var relationalId = this.targetId;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    validator.Validate(object).isProject(function(err, object) {

      if (err.valid === true) {
        db
        .let('testCase', function (s) {
          s
          .select()
          .from('TestCase')
          .where({
            id: relationalId
          })
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
        .let('project', function(s) {
          s
          .create('vertex', 'Project')
          .set(object)
          .set({_allow: [role]})
        })
        .let('creates', function (s) {
          s
          .create('edge', 'Creates')
          .from('$user')
          .to('$project')
        })
        .let('fulfills', function (s) {
          s
          .create('edge', 'Fulfills')
          .from('$project')
          .to('$testCase')
        })
        .commit()
        .return('$project')
        .transform(function(record) {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then(function (record) {
          record.testCases = [];
          resolve(record);
        })
        .catch(function (e) {
          reject();

        })
        .done();

      } else {
        reject(err);
      }
    });
  });
}

ProjectDAO.prototype.update = function (object) {
  return new Promise((resolve, reject) => {
    var targetId = this.targetId;
    var db = this.db;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    validator.Validate(object, true).isProject(function(err, object) {

      if (err.valid === true) {

        db
        .let('project', function(s) {
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
          .update('$project')
          .set(object)
        })
        .let('newProject', function(s) {
          s
          .getProject()
          .from('$project')
        })
        .commit()
        .return('$newProject')
        .transform(function (record) {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then(function (record) {
          resolve(record);
        })
        .catch(function(e) {
          reject();

        })
        .done();

      } else {
        reject(err);
      }

    });
  });
};

ProjectDAO.prototype.del = function () {
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
      resolve({id: targetId});
    })
    .catch(function(e) {
      resolve(e);

    })
    .done();
  });
}

module.exports = ProjectDAO;
