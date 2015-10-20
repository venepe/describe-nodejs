'use strict';

const _class = 'Project';
const utilites = require('../utilities');

function Search(query, params) {
  // if (!(this instanceof Search)) return new Search(query);
  this.query = query;
  this.params = params;
}

Search.prototype.findProject = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    var query = this.query;
    var user = this.user;
    var db = this.db;

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

// Search.prototype.find = function () {
//   return new Promise((resolve, reject) => {
//     var query = this.query;
//     var user = this.user;
//     var db = this.db;
//
//     query = query + '*';
//
//     db
//     .select()
//     .lucene({
//       title: query,
//       description: query,
//       category: query
//     },
//     'describe:' + query + ' OR subject:' + query + ' OR category:' + query
//     )
//     .from(_class)
//     .limit(25)
//     .transform(function(record) {
//       return utilites.FilteredObject(record, '@.*|rid');
//     })
//     .all()
//     .then(function (records) {
//       resolve(records);
//     })
//     .catch(function (e) {
//       reject();
//     })
//     .done(function() {
//       // db.close();
//     });
//   });
// }

module.exports = Search;
