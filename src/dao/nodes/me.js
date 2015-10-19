'use strict';

var _class = 'User';
var validator = require('../validator');
var utilites = require('../utilities');
var app_config = require('../../config/app-config');

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
