'use strict';

const _class = 'File';
import { filteredObject, Pagination, GraphQLHelper } from '../../utilities';
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
        return filteredObject(record, '@.*|rid', file);
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
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

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
        return filteredObject(record, '@.*|rid');
      })
      .all()
      .then((payload) => {
        let meta = GraphQLHelper.getMeta(pageObject, payload);
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

  getEdgeCovered(args) {
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

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
        return filteredObject(record, '@.*|rid');
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
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

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
        return filteredObject(record, '@.*|rid');
      })
      .all()
      .then((payload) => {
        let meta = GraphQLHelper.getMeta(pageObject, payload);
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
}

export default FileDAO;
