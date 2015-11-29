'use strict';

const _class = 'File';
const validator = require('../validator');
const utilites = require('../../utilities');
import { FileConfig } from '../../config';

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
      .transform((record) => {
        let file = new File();
        return utilites.FilteredObject(record, '@.*|rid', file);
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
      .done();
    });
  }

  getEdgeExemplifies(args) {
    let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let id = this.targetId;
      let user = this.user;
      let db = this.db;

      db
      .getFile()
      .inExemplifiesFromNode(id)
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
      .done();
    });
  }

  getEdgeCovered(args) {
    let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let id = this.targetId;
      let user = this.user;
      let db = this.db;

      db
      .getFile()
      .inCoversFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        return utilites.FilteredObject(record, '@.*|rid');
      })
      .all()
      .then((records) => {
        if (records && records.length > 0) {
          resolve(records);
        } else {
          let defaultCoverFile = {
            id: id,
            uri: FileConfig.DefaultImageUrl + id
          };
          resolve([
            defaultCoverFile
          ]);
        }
      })
      .catch((e) => {
        reject();

      })
      .done();
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
      .done();
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      let del = require('del');
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

export default FileDAO;
