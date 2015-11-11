'use strict';

const _class = 'File';
const validator = require('../validator');
const utilites = require('../utilities');

import {
  File
} from '../model';

class FileDAO {
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
      .getFile()
      .from(_class)
      .where({id: id})
      .limit(1)
      .transform(function(record) {
        var file = new File();
        return utilites.FilteredObject(record, '@.*|rid', file);
      })
      .one()
      .then(function (record) {
        resolve(record);
      })
      .catch(function (e) {
        reject();

      })
      .done(function() {
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
      .getFile()
      .outCreatesFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform(function(record) {
        return utilites.FilteredObject(record, '@.*|rid');
      })
      .all()
      .then(function (records) {
        resolve(records);
      })
      .catch(function (e) {
        reject();

      })
      .done(function() {
        // db.close();
      });
    });
  }

  getEdgeExemplifies(args) {
    var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      var id = this.targetId;
      var user = this.user;
      var db = this.db;

      db
      .getFile()
      .inExemplifiesFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform(function(record) {
        return utilites.FilteredObject(record, '@.*|rid');
      })
      .all()
      .then(function (records) {
        resolve(records);
      })
      .catch(function (e) {
        reject();

      })
      .done(function() {
        // db.close();
      });
    });
  }

  getEdgeCovered(args) {
    var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      var id = this.targetId;
      var user = this.user;
      var db = this.db;

      db
      .getFile()
      .inCoversFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform(function(record) {
        return utilites.FilteredObject(record, '@.*|rid');
      })
      .all()
      .then(function (records) {
        if (records && records.length > 0) {
          resolve(records);
        } else {
          var defaultCoverFile = {
            id: id,
            uri: 'http://localhost:8000/default/images/' + id
          };
          resolve([
            defaultCoverFile
          ]);
        }
      })
      .catch(function (e) {
        reject();

      })
      .done(function() {
        // db.close();
      });
    });
  }

  inEdgeFulfilled(args) {
    let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getFile()
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
        // db.close();
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
}

export default FileDAO;
