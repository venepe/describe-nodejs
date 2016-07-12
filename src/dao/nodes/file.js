'use strict';

const _class = 'File';
import { filteredObject, Pagination, GraphQLHelper } from '../../utilities';
import { FileConfig } from '../../config';

import {
  Cover
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
      .getCover()
      .from(_class)
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let cover = new Cover();
        return filteredObject(record, '@.*|rid', cover);
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

  getCover() {
    return new Promise((resolve, reject) => {
      let id = this.targetId;
      let user = this.user;
      let db = this.db;

      db
      .getFile()
      .inCoversFromNode(id)
      .skip(0)
      .limit(1)
      .order('createdAt DESC')
      .transform((record) => {
        return filteredObject(record, '@.*|rid');
      })
      .one()
      .then((record) => {
        if (record) {
          resolve(record);
        } else {
          let defaultCoverFile = {
            id: id,
            uri: FileConfig.DefaultImageUrl + id
          };
          resolve(
            defaultCoverFile
          );
        }
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  getEdgeFulfilled(args) {
    let pageObject = Pagination.getDescOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;
      let role = this.user.role;

      db
      .getFulfillment(role)
      .inFulfillsFromNode(id)
      .where(
        pageObject.where
      )
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        let node = filteredObject(record, '@.*|rid');
        return {
          node,
          cursor: node.createdAt,
        };
      })
      .all()
      .then((edges) => {
        let payload = GraphQLHelper.connectionFromDbArray({edges, args});
        resolve(payload);
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

}

export default FileDAO;
