'use strict';

import { filteredObject, Pagination, GraphQLHelper } from '../../utilities';

class SearchDAO {
  constructor(targetId, params) {
    this.query = query;
    this.params = params;
  }

  findUser(args) {
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let query = this.query;
      let user = this.user;
      let db = this.db;

      query = query + '*';

      db
      .getUser()
      .lucene({
        name: query,
      }
      )
      .from('User')
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

export default SearchDAO;
