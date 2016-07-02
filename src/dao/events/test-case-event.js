'use strict';

import { filteredObject, Pagination, GraphQLHelper } from '../../utilities';

import {
  TestCaseEvent
} from '../model';

class TestCaseEventDAO {
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
      .getTestCaseEvent()
      .from('TestCaseEvent')
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let testCaseEvent = new TestCaseEvent();
        return filteredObject(record, '@.*|rid', testCaseEvent);
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

  getTestCaseEvents(args) {
    let pageObject = Pagination.getAscOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getTestCaseEvent()
      .inTestCaseEvent(id)
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

export default TestCaseEventDAO;
