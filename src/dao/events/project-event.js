'use strict';

import { filteredObject, Pagination, GraphQLHelper } from '../../utilities';
import { offsetToCursor } from 'graphql-relay';

import {
  ProjectEvent
} from '../model';

class ProjectEventDAO {
  constructor(targetId, params) {
    this.targetId = targetId;
    this.params = params;
  }

  getProjectEvents(args) {
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .select('uuid as id, title, createdAt')
      .inProjectEvent(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
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

export default ProjectEventDAO;
