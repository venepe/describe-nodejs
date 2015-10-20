'use strict';

const _class = 'Paper';
const validator = require('../validator');
const utilites = require('../utilities');

import {
  Paper
} from '../model'

function PaperDAO(targetId, params) {
  // if (!(this instanceof Paper)) return new Paper(targetId);
  this.targetId = targetId;
  this.params = params;
}

PaperDAO.prototype.get = function () {
  return new Promise((resolve, reject) => {
    let user = this.user;
    let db = this.db;
    let id = this.targetId;

    db
    .getPaper()
    .from(_class)
    .where({id: id})
    .limit(1)
    .transform(function(record) {
      let paper = new Paper();
      return utilites.FilteredObject(record, '@.*|rid', paper);
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
  });
}

PaperDAO.prototype.getEdgeCreated = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    let user = this.user;
    let db = this.db;
    let id = this.targetId;

    db
    .getPaper()
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

PaperDAO.prototype.getEdgeDescribes = function (args) {
  let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    let user = this.user;
    let db = this.db;
    let id = this.targetId;

    db
    .getPaper()
    .inDescribesFromNode(id)
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

PaperDAO.prototype.create = function (object) {
  return new Promise((resolve, reject) => {
    let db = this.db;
    let relationalId = this.targetId;
    let user = this.user;
    let userId = this.user.id;
    let role = this.user.role;

    validator.Validate(object).isPaper(function(err, object) {

      if (err.valid === true) {
        db
        .let('target', function (s) {
          s
          .select()
          .from('indexvalues:id')
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
        .let('paper', function(s) {
          s
          .create('vertex', 'Paper')
          .set(object)
          .set({_allow: [role]})
        })
        .let('creates', function (s) {
          s
          .create('edge', 'Creates')
          .from('$user')
          .to('$paper')
        })
        .let('describes', function (s) {
          s
          .create('edge', 'Describes')
          .from('$paper')
          .to('$target')
        })
        .commit()
        .return('$paper')
        .transform((record) => {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then((record) => {
          resolve(record);
        })
        .catch((e) => {
          console.log(e);
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

PaperDAO.prototype.update = function (object) {
  return new Promise((resolve, reject) => {
    let targetId = this.targetId;
    let db = this.db;
    let user = this.user;
    let userId = this.user.id;
    let role = this.user.role;

    validator.Validate(object, true).isPaper(function(err, object) {

      if (err.valid === true) {

        db
        .let('paper', function(s) {
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
          .update('$paper')
          .set(object)
        })
        .let('newPaper', function(s) {
          s
          .getPaper()
          .from('$paper')
        })
        .commit()
        .return('$newPaper')
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
        .done(() => {
          db.close();
        });

      } else {
        reject(err);
      }
    });
  });
};

PaperDAO.prototype.del = function () {
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
      resolve({success: true});
    })
    .catch((e) => {
      console.log(e);
      reject();

    })
    .done(() => {
      db.close();
    });
  });
}

module.exports = PaperDAO;
