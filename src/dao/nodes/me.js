'use strict';

const _class = 'User';
const validator = require('../validator');
const utilites = require('../utilities');
const app_config = require('../../config/app-config');

function Me() {
  // if (!(this instanceof Me)) return new Me();
}

Me.prototype.get = function () {
  return new Promise((resolve, reject) => {
    var user = this.user || {};
    var db = this.db;
    var id = user.id;

    db
    .getUser()
    .from(_class)
    .where({id: id})
    .limit(1)
    .transform(function(record) {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .one()
    .then(function (record) {
      resolve(record);
    })
    .catch(function (e) {
      reject();
    })
    .done(function() {
      // db.close();
    });
  });
}

module.exports = Me;
