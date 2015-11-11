'use strict';

const _class = 'File';
const validator = require('../validator');
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

      validator.Validate(object).isFile(function(err, object) {

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
          .let('file', function(s) {
            s
            .create('vertex', 'File')
            .set(object)
            .set({_allow: [role]})
          })
          .let('creates', function (s) {
            s
            .create('edge', 'Creates')
            .from('$user')
            .to('$file')
          })
          .let('fulfills', function (s) {
            s
            .create('edge', 'Fulfills')
            .from('$file')
            .to('$testCase')
          })
          .commit()
          .return('$file')
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
      var del = require('del');
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('deletes', function (s) {
        s
        .delete('VERTEX', _class)
        .where({
          id: targetId
        })
      })
      .let('testCase', function (s) {
        s
        .getTestCase()
        .from('TestCase')
        .where({
          id: testCaseId
        })
      })
      .commit()
      .return('$testCase')
      .transform(function(record) {
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
        return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
      })
      .one()
      .then(function (testCase) {
        let payload = {deletedFulfillmentId: targetId, testCase};
        resolve(payload);
      })
      .catch(function (e) {
        reject();

      })
      .done(() => {
        // db.close();
      });
    });
  }
}

export default FulfillmentDAO;
