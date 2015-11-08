'use strict';

const _class = 'File';
const validator = require('../validator');
const utilites = require('../utilities');

import {
  File
} from '../model'

function ExampleDAO(targetId, params) {
  // if (!(this instanceof ExampleDAO)) return new ExampleDAO(targetId);
  this.targetId = targetId;
  this.params = params;
}

ExampleDAO.prototype.create = function (object) {
  return new Promise((resolve, reject) => {
    var db = this.db;
    var relationalId = this.targetId;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    validator.Validate(object).isFile(function(err, object) {

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
        .let('exemplifies', function (s) {
          s
          .create('edge', 'Exemplifies')
          .from('$file')
          .to('$target')
        })
        .commit()
        .return('$file')
        .transform(function(record) {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then(function (record) {
          resolve(record);
        })
        .catch(function (e) {
          console.log(e);
          console.log('we have an eror');
          reject();

        })
        .done();

      } else {
        reject(err);
      }
    });
  });
}

ExampleDAO.prototype.del = function () {
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
    .then(function() {
      resolve({id: targetId});
    })
    .catch(function(e) {
      console.log(e);
      reject();

    })
    .done();
  });
}

module.exports = ExampleDAO;
