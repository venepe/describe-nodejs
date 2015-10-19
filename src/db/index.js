'use strict';

var OrientDB = require('orientjs');
var utilites = require('../dao/utilities');

OrientDB.Statement.prototype.SMTINode = '';

OrientDB.Db.prototype.getUser = function() {
  this.SMTINode = 'User';
  return this.select('id, username, fullName, summary, email, createdAt, updatedAt');
}

OrientDB.Statement.prototype.getUser = function() {
  return this.select('id, username, fullName, summary, email, createdAt, updatedAt');
}

OrientDB.Db.prototype.getTestCase = function() {
  this.SMTINode = 'TestCase';
  return this.select('id, it, createdAt, updatedAt');
}

OrientDB.Statement.prototype.getTestCase = function() {
  return this.select('id, it, createdAt, updatedAt');
}

OrientDB.Statement.prototype.addTestCases = function() {
  var statement = 'expand(outE(\'Requires\').inV(\'TestCase\'))';

  return this.select('$tc[0-24].id as tcId, $tc[0-24].it as tcIt, $tc[0-24].createdAt as tcCreatedAt, $tc[0-24].updatedAt as tcUpdatedAt')
        .let('tc', function(s) {
          s
          .select()
          .from(function (s) {
            s
            .select(statement)
            .from('$parent.$current')
            .order({
              createdAt: 'DESC'
            })
          })
          .where({'@class': 'TestCase'})
          .skip(0)
          .limit(25)
        })
        .transform(function(record) {
          var testCases = [];
          for (var i = record.tcId.length - 1; i >= 0; i--) {
            testCases.unshift({id: record.tcId[i], it: record.tcIt[i], createdAt: record.tcCreatedAt[i], updatedAt: record.tcUpdatedAt[i]})
          }
          record.testCases = testCases;
          return utilites.FilteredObject(record, 'tc.*');
        })
}

OrientDB.Db.prototype.getImage = function() {
  this.SMTINode = 'Image';
  return this.select('id, uri, createdAt, updatedAt');
}

OrientDB.Statement.prototype.getImage = function() {
  return this.select('id, uri, createdAt, updatedAt');
}

OrientDB.Statement.prototype.addImages = function() {
  return this.select('$img[0-24].id as imgId, $img[0-24].uri as imgUri, $img[0-24].createdAt as imgCreatedAt, $img[0-24].updatedAt as imgUpdatedAt')
        .let('img', function(s) {
          s
          .select()
          .from(function (s) {
            s
            .select('expand(outE(\'Describes\').inV(\'Image\'))')
            .from('$parent.$current')
            .order({
              createdAt: 'DESC'
            })
          })
          .where({'@class': 'Image'})
        })
        .transform(function(record) {
          var images = [];
          for (var i = record.imgId.length - 1; i >= 0; i--) {
            images.push({id: record.imgId[i], uri: record.imgUri[i], createdAt: record.imgCreatedAt[i], updatedAt: record.imgUpdatedAt[i]})
          }
          record.images = images;
          return utiluries.FilteredObject(record, 'img.*');
        })
}

OrientDB.Db.prototype.getProject = function() {
  this.SMTINode = 'Project';
  return this.select('id, title, createdAt, updatedAt')
}

OrientDB.Statement.prototype.getProject = function() {
  return this.select('id, title, createdAt, updatedAt')
}

OrientDB.Db.prototype.getPaper = function() {
  this.SMTINode = 'Paper';
  return this.select('id, text, createdAt, updatedAt')
}

OrientDB.Statement.prototype.getPaper = function() {
  return this.select('id, text, createdAt, updatedAt')
}

OrientDB.Statement.prototype.addPapers = function() {
  return this.select('$ppr[0-24].id as pprId, $ppr[0-24].text as pprText, $ppr[0-24].createdAt as pprCreatedAt, $ppr[0-24].updatedAt as pprUpdatedAt')
        .let('ppr', function(s) {
          s
          .select()
          .from(function (s) {
            s
            .select('expand(outE(\'Describes\').inV(\'Paper\'))')
            .from('$parent.$current')
            .order({
              createdAt: 'DESC'
            })
          })
          .where({'@class': 'Paper'})
        })
        .transform(function(record) {
          var papers = [];
          for (var i = record.pprId.length - 1; i >= 0; i--) {
            papers.push({id: record.pprId[i], text: record.pprText[i], createdAt: record.pprCreatedAt[i], updatedAt: record.pprUpdatedAt[i]})
          }
          record.papers = papers;
          return utiltextes.FilteredObject(record, 'ppr.*');
        })
}

OrientDB.Statement.prototype.outCreatesFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out("Creates"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.inCreatesFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in("Creates"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.outDescribesFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out("Describes"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.inDescribesFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in("Describes"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.outFulfillsFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out("Fulfills"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.inFulfillsFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in("Fulfills"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.outRequiresFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out("Requires"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.inRequiresFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in("Requires"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.outCoversFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out("Covers"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.inCoversFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in("Covers"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:id')
      .where({id: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

module.exports = OrientDB
