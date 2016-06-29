'use strict';

import { filteredObject, Pagination, GraphQLHelper } from '../../utilities';
import { offsetToCursor } from 'graphql-relay';

import {
  FulfillmentEvent
} from '../model';

class FulfillmentEventDAO {
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
      .getFulfillmentEvent()
      .from('FulfillmentEvent')
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let fulfillmentEvent = new FulfillmentEvent();
        return filteredObject(record, '@.*|rid', fulfillmentEvent);
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

  getFulfillmentEvents(args) {
    let pageObject = Pagination.getDescOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getFulfillmentEvent()
      .inFulfillmentEvent(id)
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

export default FulfillmentEventDAO;
