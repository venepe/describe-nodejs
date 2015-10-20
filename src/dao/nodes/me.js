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
    let user = this.user || {};
    let db = this.db;
    let id = user.id;

    db
    .getUser()
    .from(_class)
    .where({id: id})
    .limit(1)
    .transform((record) => {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .one()
    .then((record) => {
      resolve(record);
    })
    .catch((e) => {
      reject();
    })
    .done(() => {
      db.close();
    });
  });
}

module.exports = Me;
