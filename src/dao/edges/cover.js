'use strict';

const _class = 'File';
const { SMTIValidator } = require('../validator');
const utilites = require('../utilities');

import {
  File
} from '../model';

class CoverDAO {
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
          .let('target', (s) => {
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
          .let('covers', (s) => {
            s
            .create('edge', 'Covers')
            .from('$file')
            .to('$target')
          })
          .commit()
          .return('$file')
          .transform((record) => {
            return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
          })
          .one()
          .then((record) => {
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
        console.log(e);
        reject();

      })
      .done();
    });
  }
}

export default CoverDAO;
