'use strict';

import OrientDB from 'orientjs';
import { filteredObject } from '../utilities';

OrientDB.Statement.prototype.SMTINode = '';

OrientDB.Db.prototype.getUser = function() {
  this.SMTINode = 'User';
  return this.select('id, name, fullName, summary, email, createdAt, updatedAt');
}

OrientDB.Statement.prototype.getUser = function() {
  return this.select('id, name, fullName, summary, email, createdAt, updatedAt');
}

OrientDB.Db.prototype.getTestCase = function() {
  this.SMTINode = 'TestCase';
  return this.select('id, it, createdAt, updatedAt, inE(\'Fulfills\') as isFulfilled');
}

OrientDB.Statement.prototype.getTestCase = function() {
  return this.select('id, it, createdAt, updatedAt, inE(\'Fulfills\') as isFulfilled');
}

OrientDB.Db.prototype.getFile = function() {
  this.SMTINode = 'File';
  return this.select('id, uri, createdAt, updatedAt');
}

OrientDB.Statement.prototype.getFile = function() {
  return this.select('id, uri, createdAt, updatedAt');
}

OrientDB.Db.prototype.getProject = function() {
  this.SMTINode = 'Project';
  return this.select('id, title, createdAt, updatedAt, outE(\'Requires\').size() as numOfTestCases, $tcF.size() as numOfTestCasesFulfilled')
    .let('tcF', function(s) {
      s
      .select()
      .from(function (s) {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\'))')
        .from('$parent.$current')
      })
      .where(
        'inE(\'Fulfills\').size() > 0'
      )
    })
}

OrientDB.Statement.prototype.getProject = function() {
  return this.select('id, title, createdAt, updatedAt, outE(\'Requires\').size() as numOfTestCases, $tcF.size() as numOfTestCasesFulfilled')
    .let('tcF', function(s) {
      s
      .select()
      .from(function (s) {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\'))')
        .from('$parent.$current')
      })
      .where(
        'inE(\'Fulfills\').size() > 0'
      )
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

OrientDB.Statement.prototype.outLeadsFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out("Leads"))')
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

OrientDB.Statement.prototype.inLeadsFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in("Leads"))')
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

OrientDB.Statement.prototype.outCollaboratesOnFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out("CollaboratesOn"))')
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

OrientDB.Statement.prototype.inCollaboratesOnFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in("CollaboratesOn"))')
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

export default OrientDB
