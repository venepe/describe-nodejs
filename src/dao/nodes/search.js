'use strict';

const _class = 'Project';
const utilites = require('../../utilities');

class SearchDAO {
  constructor(targetId, params) {
    this.query = query;
    this.params = params;
  }

  findProject(args) {
    let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let query = this.query;
      let user = this.user;
      let db = this.db;

      query = query + '*';

      db
      .select()
      .lucene({
        title: query,
      }
      )
      .from(_class)
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
}

export default SearchDAO;
