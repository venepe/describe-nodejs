var exports = module.exports;

var _class = 'Image';
var validator = require('../validator');
var utilites = require('../utilities');

import {
  Image
} from '../model'

function ImageDAO(targetId, params) {
  // if (!(this instanceof Image)) return new Image(targetId);
  this.targetId = targetId;
  this.params = params;
}

ImageDAO.prototype.get = function () {
  return new Promise((resolve, reject) => {
    var user = this.user;
    var db = this.db;
    var id = this.targetId;

    db
    .getImage()
    .from(_class)
    .where({id: id})
    .limit(1)
    .transform(function(record) {
      var image = new Image();
      return utilites.FilteredObject(record, '@.*|rid', image);
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

ImageDAO.prototype.getEdgeCreated = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getImage()
    .outCreatesFromNode(id)
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

ImageDAO.prototype.getEdgeDescribes = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getImage()
    .inDescribesFromNode(id)
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

ImageDAO.prototype.getEdgeCovered = function (args) {
  var pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

  return new Promise((resolve, reject) => {
    var id = this.targetId;
    var user = this.user;
    var db = this.db;

    db
    .getImage()
    .inCoversFromNode(id)
    .skip(pageObject.skip)
    .limit(pageObject.limit)
    .order(pageObject.orderBy)
    .transform(function(record) {
      return utilites.FilteredObject(record, '@.*|rid');
    })
    .all()
    .then(function (records) {
      if (records && records.length > 0) {
        resolve(records);
      } else {
        var defaultCoverImage = {
          id: id,
          uri: 'http://localhost:3000/default/images/' + id
        };
        resolve([
          defaultCoverImage
        ]);
      }
    })
    .catch(function (e) {
      reject();

    })
    .done(function() {
      // db.close();
    });
  });
}

ImageDAO.prototype.create = function (object) {
  return new Promise((resolve, reject) => {
    var db = this.db;
    var relationalId = this.targetId;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    validator.Validate(object).isImage(function(err, object) {

      if (err.valid === true) {
        db
        .let('target', function (s) {
          s
          .select()
          .from('indexvalues:id')
          .where({
            id: relationalId
          })
          .where(
            '_allow CONTAINS "' + role + '"'
          )
        })
        .let('user', function (s) {
          s
          .select()
          .from('User')
          .where({
            id: userId
          })
          .where(
            '_allow CONTAINS "' + role + '"'
          )
        })
        .let('image', function(s) {
          s
          .create('vertex', 'Image')
          .set(object)
          .set({_allow: [role]})
        })
        .let('creates', function (s) {
          s
          .create('edge', 'Creates')
          .from('$user')
          .to('$image')
        })
        .let('describes', function (s) {
          s
          .create('edge', 'Describes')
          .from('$image')
          .to('$target')
        })
        .commit()
        .return('$image')
        .transform(function(record) {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then(function (record) {
          resolve(record);
        })
        .catch(function (e) {
          console.log(e);
          console.log('we have an eror');
          reject();

        })
        .done();

      } else {
        reject(err);
      }
    });
  });
}

ImageDAO.prototype.createCover = function (object) {
  return new Promise((resolve, reject) => {
    var db = this.db;
    var relationalId = this.targetId;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    validator.Validate(object).isImage(function(err, object) {

      if (err.valid === true) {
        db
        .let('target', function (s) {
          s
          .select()
          .from('indexvalues:id')
          .where({
            id: relationalId
          })
          .where(
            '_allow CONTAINS "' + role + '"'
          )
        })
        .let('user', function (s) {
          s
          .select()
          .from('User')
          .where({
            id: userId
          })
          .where(
            '_allow CONTAINS "' + role + '"'
          )
        })
        .let('image', function(s) {
          s
          .create('vertex', 'Image')
          .set(object)
          .set({_allow: [role]})
        })
        .let('creates', function (s) {
          s
          .create('edge', 'Creates')
          .from('$user')
          .to('$image')
        })
        .let('covers', function (s) {
          s
          .create('edge', 'Covers')
          .from('$image')
          .to('$target')
        })
        .commit()
        .return('$image')
        .transform(function(record) {
          return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
        })
        .one()
        .then(function (record) {
          resolve(record);
        })
        .catch(function (e) {
          console.log(e);
          console.log('we have an eror');
          reject();

        })
        .done();

      } else {
        reject(err);
      }
    });
  });
}

ImageDAO.prototype.del = function () {
  return new Promise((resolve, reject) => {
    var del = require('del');
    var targetId = this.targetId;
    var db = this.db;
    var user = this.user;
    var userId = this.user.id;
    var role = this.user.role;

    db.delete('VERTEX', _class)
    .where({
      id: targetId
    })
    .where(
      '_allow CONTAINS "' + role + '"'
    )
    .one()
    .then(function() {
      resolve({id: targetId});
    })
    .catch(function(e) {
      console.log(e);
      reject();

    })
    .done();
  });
}

module.exports = ImageDAO;
