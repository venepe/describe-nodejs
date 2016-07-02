'use strict';

import { filteredObject, Pagination, GraphQLHelper } from '../../utilities';

import {
  ProjectEvent
} from '../model';

class ProjectEventDAO {
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
      .getProjectEvent()
      .from('ProjectEvent')
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let projectEvent = new ProjectEvent();
        return filteredObject(record, '@.*|rid', projectEvent);
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

  getProjectEvents(args) {
    let pageObject = Pagination.getAscOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getProjectEvent()
      .inProjectEvent(id)
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

export default ProjectEventDAO;
