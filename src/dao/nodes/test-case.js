'use strict';

const _class = 'TestCase';
const validator = require('../validator');
const utilites = require('../utilities');

import {
  TestCase
} from '../model';

class TestCaseDAO {
  constructor(targetId, params) {
    this.targetId = targetId;
    this.params = params;
  }

  get() {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getTestCase()
      .from(_class)
      .where({id: id})
      .limit(1)
      .transform((record) => {
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
        let testCase = new TestCase();
        return utilites.FilteredObject(record, '@.*|rid', testCase);
      })
      .one()
      .then((record) => {
        resolve(record);
      })
      .catch((e) => {
        reject();

      })
      .done(() => {
        // db.close();
      });
    });
  }

  getEdgeCreated(args) {
    let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getTestCase()
      .outCreatesFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
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
        // db.close();
      });
    });
  }

  getEdgeRequired(args) {
    let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getTestCase()
      .outRequiresFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
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
        // db.close();
      });
    });
  }

  getEdgeTargeted() {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getTestCase()
      .outTargetsRequiresFromNode(id)
      .transform((record) => {
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
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
        // db.close();
      });
    });
  }

  create(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      let relationalId = this.targetId;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

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
          .transform((record) => {
            return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
          })
          .one()
          .then((result) => {
            resolve(result);
          })
          .catch((e) => {
            console.log(e);
            reject();

          })
          .done(() => {
            // db.close();
          });

        } else {
          reject(err);
        }
      });
    });
  }

  update(object) {
    return new Promise((resolve, reject) => {
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

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
            // db.close();
          });

        } else {
          reject(err);
        }

      });
    });
  }

  del() {
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
        // db.close();
      });
    });

  }
}

export default TestCaseDAO;
