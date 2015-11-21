'use strict';

const _class = 'File';
const { SMTIValidator } = require('../validator');
const utilites = require('../utilities');

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
            .from('TestCase')
            .where({
              id: relationalId
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
          .return('$file')
          .transform((record) => {
            return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
          })
          .one()
          .then((record) => {
            record.testCases = [];
            resolve(record);
          })
          .catch((e) => {
            console.log('orientdb error: ' + e);
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
        reject();

      })
      .done(() => {
        // db.close();
      });
    });
  }
}

export default FulfillmentDAO;
