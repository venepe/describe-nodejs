'use strict';

const _class = 'File';
const { SMTIValidator } = require('../validator');
const utilites = require('../../utilities');

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
              '_allow CONTAINS "' + role + '"'
            )
          })
          .let('file', (s) => {
            s
            .create('vertex', 'File')
            .set(object)
            .set({_allow: [role]})
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
          .commit()
          .return(['$file', '$testCase', '$project'])
          .all()
          .then((result) => {
            let file = utilites.FilteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let testCase = utilites.FilteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let project = utilites.FilteredObject(result[2], 'in_.*|out_.*|@.*|^_');

            if (testCase.isFulfilled.length === 0) {
              let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
              numOfTestCasesFulfilled++;
              project.numOfTestCasesFulfilled = numOfTestCasesFulfilled;
              console.log(numOfTestCasesFulfilled);
            }

            testCase.isFulfilled = true;
            resolve({
              file,
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
      .let('deletes', (s) => {
        s
        .delete('VERTEX', _class)
        .where({
          id: targetId
        })
      })
      .let('testCase', (s) => {
        s
        .getTestCase()
        .from('TestCase')
        .where({
          id: testCaseId
        })
      })
      .commit()
      .return('$testCase')
      .transform((record) => {
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
        return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
      })
      .one()
      .then((testCase) => {
        let payload = {deletedFulfillmentId: targetId, testCase};
        resolve(payload);
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
