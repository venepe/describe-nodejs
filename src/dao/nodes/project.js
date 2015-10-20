'use strict';

const _class = 'Project';
const validator = require('../validator');
const utilites = require('../utilities');

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
    let user = this.user;
    let db = this.db;
    let id = this.targetId;

  db
  .getProject()
  .from(_class)
  .where({id: id})
  .limit(1)
  .transform((record) => {
    let project = new Project();
    return utilites.FilteredObject(record, '@.*|rid', project);
  })
  .one()
  .then((record) => {
    resolve(record);
  })
  .catch((e) => {
    reject();

  })
  .done(function() {
    db.close();
  });
});
}

ProjectDAO.prototype.inEdgeRequired = function () {
  return new Promise((resolve, reject) => {
    let user = this.user;
    let db = this.db;
    let id = this.targetId;

    db
    .getProject()
    .inRequiresFromNode(id)
    .limit(25)
    .transform((record) => {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .all()
    .then((records) => {
      resolve(records);
    })
    .catch((e) => {
      reject();

    })
    .done(function() {
      db.close();
    });
  });
}

ProjectDAO.prototype.inEdgeFulfilled = function (args) {
  let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    let user = this.user;
    let db = this.db;
    let id = this.targetId;

    db
    .getProject()
    .inFulfillsFromNode(id)
    .skip(pageObject.skip)
    .limit(pageObject.limit)
    .order(pageObject.orderBy)
    .transform((record) => {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .all()
    .then((records) => {
      resolve(records);
    })
    .catch((e) => {
      reject();

    })
    .done(() => {
      db.close();
    });
  });
}

ProjectDAO.prototype.getEdgeCreated = function (args) {
  let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    let user = this.user;
    let db = this.db;
    let id = this.targetId;

    db
    .getProject()
    .outCreatesFromNode(id)
    .skip(pageObject.skip)
    .limit(pageObject.limit)
    .order(pageObject.orderBy)
    .transform((record) => {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .all()
    .then((records) => {
      resolve(records);
    })
    .catch((e) => {
      reject();

    })
    .done(() => {
      db.close();
    });
  });
}

ProjectDAO.prototype.create = function (object) {
  return new Promise((resolve, reject) => {
    let db = this.db;
    let relationalId = this.targetId;
    let user = this.user;
    let userId = this.user.id;
    let role = this.user.role;

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
        .transform((record) => {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then((record) => {
          record.testCases = [];
          resolve(record);
        })
        .catch((e) => {
          reject();

        })
        .done(() => {
          db.close();
        });

      } else {
        reject(err);
      }
    });
  });
}

ProjectDAO.prototype.createFulfills = function (object) {
  return new Promise((resolve, reject) => {
    let db = this.db;
    let relationalId = this.targetId;
    let user = this.user;
    let userId = this.user.id;
    let role = this.user.role;

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
        .transform((record) => {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then((record) => {
          record.testCases = [];
          resolve(record);
        })
        .catch((e) => {
          reject();

        })
        .done(() => {
          db.close();
        });

      } else {
        reject(err);
      }
    });
  });
}

ProjectDAO.prototype.update = function (object) {
  return new Promise((resolve, reject) => {
    let targetId = this.targetId;
    let db = this.db;
    let user = this.user;
    let userId = this.user.id;
    let role = this.user.role;

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
        .transform((record) => {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then((record) => {
          resolve(record);
        })
        .catch((e) => {
          reject();

        })
        .done(() => {
          db.close();
        });

      } else {
        reject(err);
      }

    });
  });
};

ProjectDAO.prototype.del = function () {
  return new Promise((resolve, reject) => {
    let targetId = this.targetId;
    let db = this.db;
    let user = this.user;
    let userId = this.user.id;
    let role = this.user.role;

    db.delete('VERTEX', _class)
    .where({
      id: targetId
    })
    .where(
      '_allow CONTAINS "' + role + '"'
    )
    .one()
    .then(() => {
      resolve({id: targetId});
    })
    .catch((e) => {
      resolve(e);

    })
    .done(() => {
      db.close();
    });
  });
}

module.exports = ProjectDAO;
