'use strict';

const _class = 'TestCase';
const { SMTIValidator } = require('../validator');
const utilities = require('../../utilities');

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
        return utilities.FilteredObject(record, '@.*|rid', testCase);
      })
      .one()
      .then((record) => {
        resolve(record);
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  getEdgeCreated(args) {
    let pageObject = utilities.Pagination.getOrientDBPageFromGraphQL(args);

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
        return utilities.FilteredObject(record, '@.*|rid');
      })
      .all()
      .then((payload) => {
        let meta = utilities.GraphQLHelper.getMeta(pageObject, payload);
        resolve({
          payload,
          meta
        });
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  getEdgeRequired(args) {
    let pageObject = utilities.Pagination.getOrientDBPageFromGraphQL(args);

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
        return utilities.FilteredObject(record, '@.*|rid');
      })
      .all()
      .then((payload) => {
        let meta = utilities.GraphQLHelper.getMeta(pageObject, payload);
        resolve({
          payload,
          meta
        });
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  create(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      let relationalId = this.targetId;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      let validator = new SMTIValidator(object);

      validator
        .isTestCase()
        .then((object) => {
          db
          .let('project', (s) => {
            s
            .select('*')
            .select('outE(\'Requires\').size() as numOfTestCases')
            .from('Project')
            .where({
              id: relationalId
            })
            .where(
              '_allow CONTAINS "' + role + '%"'
            )
          })
          .let('user', (s) => {
            s
            .select()
            .from('User')
            .where({
              id: userId
            })
            .where(
              '_allow CONTAINS "' + role + '%"'
            )
          })
          .let('testCase', (s) => {
            s
            .create('vertex', 'TestCase')
            .set(object)
            .set('_allow = $project._allow')
          })
          .let('creates', (s) => {
            s
            .create('edge', 'Creates')
            .from('$user')
            .to('$testCase')
          })
          .let('requires', (s) => {
            s
            .create('edge', 'Requires')
            .from('$project')
            .to('$testCase')
          })
          .commit()
          .return(['$testCase', '$project'])
          .all()
          .then((result) => {
            let testCase = utilities.FilteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let project = utilities.FilteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let numOfTestCases = project.numOfTestCases;
            numOfTestCases++;
            project.numOfTestCases = numOfTestCases;
            resolve({
              testCase,
              project
            });
          })
          .catch((e) => {
            console.log(`orientdb error: ${e}`);
            reject();

          })
          .done();
        })
        .catch((errors) => {
          reject(errors);
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

      let validator = new SMTIValidator(object, true);

      validator
        .isTestCase()
        .then((object) => {
          db
          .let('testCase', (s) => {
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
          .let('update', (s) => {
            s
            .update('$testCase')
            .set(object)
          })
          .let('newTestCase', (s) => {
            s
            .getTestCase()
            .from('$testCase')
          })
          .commit()
          .return('$newTestCase')
          .transform((record) => {
            return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
          })
          .one()
          .then((record) => {
            resolve(record);
          })
          .catch((e) => {
            console.log(`orientdb error: ${e}`);
            reject();

          })
          .done();
        })
        .catch((errors) => {
          reject(errors);
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

      db
      .let('testCase', (s) => {
        s
        .getTestCase()
        .from(_class)
        .where({
          id: targetId
        })
      })
      .let('project', (s) => {
        s
        .getProject()
        .from(function (s) {
          s
          .select('expand(in("Requires"))')
          .from('TestCase')
          .where({
            id: targetId
          })
          .limit(1)
        })
      })
      .let('delete', (s) => {
        s
        .delete('VERTEX', _class)
        .where({
          id: targetId
        })
      })
      .commit()
      .return(['$testCase', '$project'])
      .all()
      .then((result) => {
        let testCase = utilities.FilteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let project = utilities.FilteredObject(result[1], 'in_.*|out_.*|@.*|^_');
        let numOfTestCases = project.numOfTestCases;
        numOfTestCases--;
        project.numOfTestCases = numOfTestCases;
        if (testCase.isFulfilled.length > 0) {
          let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
          numOfTestCasesFulfilled--;
          project.numOfTestCasesFulfilled = numOfTestCasesFulfilled;
        }
        resolve({
          deletedTestCaseId: targetId,
          project
        });
      })
      .catch((e) => {
        console.log(`orientdb error: ${e}`);
        reject();
      })
      .done();
    });

  }
}

export default TestCaseDAO;
