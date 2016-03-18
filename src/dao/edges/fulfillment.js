'use strict';

const _class = 'File';
const { SMTIValidator } = require('../validator');
const utilites = require('../../utilities');
import { roles, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';

import {
  File
} from '../model';

class FulfillmentDAO {
  constructor(targetId, params) {
    this.targetId = targetId;
    this.params = params;
  }

  create(object) {
    return new Promise((resolve, reject) => {
      var db = this.db;
      var relationalId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      let validator = new SMTIValidator(object);

      validator
        .isFile()
        .then((object) => {
          db
          .let('testCase', (s) => {
            s
            .select()
            .getTestCase()
            .from('TestCase')
            .where({
              id: relationalId
            })
            .where(
              `_allow["${role}"].asString() MATCHES "${regExRoles.addEdge}"`
            )
          })
          .let('project', (s) => {
            s
            .getProject()
            .from(function (s) {
              s
              .select('expand(in("Requires"))')
              .from('TestCase')
              .where({
                id: relationalId
              })
              .limit(1)
            })
          })
          .let('user', (s) => {
            s
            .select()
            .from('User')
            .where({
              id: userId
            })
            .where(
              `_allow["${role}"] = ${roles.owner}`
            )
          })
          .let('file', (s) => {
            s
            .create('vertex', 'File')
            .set(object)
            .set('_allow = $testCase._allow[0]')
          })
          .let('creates', (s) => {
            s
            .create('edge', 'Creates')
            .from('$user')
            .to('$file')
          })
          .let('fulfills', (s) => {
            s
            .create('edge', 'Fulfills')
            .from('$file')
            .to('$testCase')
          })
          .let('cursor', s => {
            s
            .select('inE(\'Fulfills\').size() as cursor')
            .from('TestCase')
            .where({
              id: relationalId
            })
          })
          .commit()
          .return(['$file', '$testCase', '$project', '$cursor'])
          .all()
          .then((result) => {
            let node = utilites.FilteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let testCase = utilites.FilteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let project = utilites.FilteredObject(result[2], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[3].cursor);

            if (testCase.isFulfilled.length === 0) {
              let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
              numOfTestCasesFulfilled++;
              project.numOfTestCasesFulfilled = numOfTestCasesFulfilled;
            }

            testCase.isFulfilled = true;

            events.publish(`/testcases/${relationalId}/fulfillments`, {
              fulfillmentEdge: {
                cursor,
                node
              },
              testCase,
              project
            });

            resolve({
              fulfillmentEdge: {
                cursor,
                node
              },
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

  del(testCaseId) {
    return new Promise((resolve, reject) => {
      var del = require('del');
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('testCase', (s) => {
        s
        .getTestCase()
        .from('TestCase')
        .where({
          id: testCaseId
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
            id: testCaseId
          })
          .limit(1)
        })
      })
      .let('deletes', (s) => {
        s
        .delete('VERTEX', _class)
        .where({
          id: targetId
        })
        .where(
          `_allow["${role}"].asString() MATCHES "${regExRoles.deleteNode}"`
        )
      })
      .commit()
      .return(['$testCase', '$project'])
      .all()
      .then((result) => {
        let testCase = utilites.FilteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let project = utilites.FilteredObject(result[1], 'in_.*|out_.*|@.*|^_');
        let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
        let isFulfilled = testCase.isFulfilled;

        //Because the test case is pull before the fulfillment is deleted
        testCase.isFulfilled = (isFulfilled.length > 1) ? true : false;
        if (!testCase.isFulfilled) {
          let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
          numOfTestCasesFulfilled--;
          project.numOfTestCasesFulfilled = numOfTestCasesFulfilled;
        }

        events.publish(`/testcases/${testCaseId}/fulfillments/${targetId}`, {
          id: targetId,
          deletedFulfillmentId: targetId,
          testCase,
          project
        });

        resolve({
          deletedFulfillmentId: targetId,
          testCase,
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

export default FulfillmentDAO;
