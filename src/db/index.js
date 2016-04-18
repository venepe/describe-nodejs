'use strict';

import OrientDB from 'orientjs';
import { filteredObject } from '../utilities';
import { fulfillmentStatus } from '../constants';

OrientDB.Statement.prototype.SMTINode = '';

OrientDB.Db.prototype.getUser = function() {
  this.SMTINode = 'User';
  return this.select('uuid as id, name, fullName, summary, email, createdAt, updatedAt');
}

OrientDB.Statement.prototype.getUser = function() {
  return this.select('uuid as id, name, fullName, summary, email, createdAt, updatedAt');
}

OrientDB.Db.prototype.getTestCase = function() {
  this.SMTINode = 'TestCase';
  return this.select('uuid as id, it, createdAt, updatedAt, $isFulfilled as isFulfilled')
  .let('isFulfilled', function(s) {
    s
    .select()
    .from(function (s) {
      s
      .select('in_Fulfills')
      .from('$parent.$current')
      .where(
        `in_Fulfills.status <> ${fulfillmentStatus.REJECTED}`
      )
    })
  })
}

OrientDB.Statement.prototype.getTestCase = function() {
  return this.select('uuid as id, it, createdAt, updatedAt, $isFulfilled as isFulfilled')
  .let('isFulfilled', function(s) {
    s
    .select()
    .from(function (s) {
      s
      .select('in_Fulfills')
      .from('$parent.$current')
      .where(
        'in_Fulfills.status <> 1'
      )
    })
  })
}

OrientDB.Db.prototype.getFile = function() {
  this.SMTINode = 'File';
  return this.select('uuid as id, uri, createdAt, updatedAt');
}

OrientDB.Statement.prototype.getFile = function() {
  return this.select('uuid as id, uri, createdAt, updatedAt');
}

OrientDB.Db.prototype.getProject = function() {
  this.SMTINode = 'Project';
  return this.select('uuid as id, title, createdAt, updatedAt, outE(\'Requires\').size() as numOfTestCases, $tcF.size() as numOfTestCasesFulfilled')
    .let('tcF', function(s) {
      s
      .select()
      .from(function (s) {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\'))')
        .from('$parent.$current')
      })
      .where(
        'in_Fulfills.status <> 1'
      )
    })
}

OrientDB.Statement.prototype.getProject = function() {
  return this.select('uuid as id, title, createdAt, updatedAt, outE(\'Requires\').size() as numOfTestCases, $tcF.size() as numOfTestCasesFulfilled')
    .let('tcF', function(s) {
      s
      .select()
      .from(function (s) {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\'))')
        .from('$parent.$current')
      })
      .where(
        'in_Fulfills.status <> 1'
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
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
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
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.getFulfillment = function() {
  return this.select('uuid as id, status, reason, createdAt, updatedAt, $file[0] as file')
    .let('file', function(s) {
      s
      .getFile()
      .from(function (s) {
        s
        .select('expand(out[@class = "File"])')
        .from('$parent.$current')
        .limit(1)
      })
    })
}

OrientDB.Db.prototype.getFulfillment = function() {
  return this.select('uuid as id, status, reason, createdAt, updatedAt, $file[0] as file')
    .let('file', function(s) {
      s
      .getFile()
      .from(function (s) {
        s
        .select('expand(out[@class = "File"])')
        .from('$parent.$current')
        .limit(1)
      })
    })
}

OrientDB.Db.prototype.getCollaborator = function() {
  return this.select('uuid as id, role, createdAt, updatedAt, $profile[0] as profile')
    .let('profile', function(s) {
      s
      .getUser()
      .from(function (s) {
        s
        .select('expand(out[@class = "User"])')
        .from('$parent.$current')
        .limit(1)
      })
      .limit(1)
    })
}

OrientDB.Statement.prototype.getCollaborator = function() {
  return this.select('uuid as id, role, createdAt, updatedAt, $profile[0] as profile')
    .let('profile', function(s) {
      s
      .getUser()
      .from(function (s) {
        s
        .select('expand(out[@class = "User"])')
        .from('$parent.$current')
        .limit(1)
      })
      .limit(1)
    })
}

OrientDB.Db.prototype.getProjectEvent = function() {
  return this.select('uuid as id, title, createdAt, $author[0] as author')
    .let('author', function(s) {
      s
      .getUser()
      .from(function (s) {
        s
        .select('expand(out[@class = "User"])')
        .from('$parent.$current')
        .limit(1)
      })
      .limit(1)
    })
}

OrientDB.Statement.prototype.getProjectEvent = function() {
  return this.select('uuid as id, title, createdAt, $author[0] as author')
    .let('author', function(s) {
      s
      .getUser()
      .from(function (s) {
        s
        .select('expand(out[@class = "User"])')
        .from('$parent.$current')
        .limit(1)
      })
      .limit(1)
    })
}

OrientDB.Db.prototype.getTestCaseEvent = function() {
  return this.select('uuid as id, it, createdAt, $author[0] as author')
    .let('author', function(s) {
      s
      .getUser()
      .from(function (s) {
        s
        .select('expand(out[@class = "User"])')
        .from('$parent.$current')
        .limit(1)
      })
      .limit(1)
    })
}

OrientDB.Statement.prototype.getTestCaseEvent = function() {
  return this.select('uuid as id, it, createdAt, $author[0] as author')
    .let('author', function(s) {
      s
      .getUser()
      .from(function (s) {
        s
        .select('expand(out[@class = "User"])')
        .from('$parent.$current')
        .limit(1)
      })
      .limit(1)
    })
}

OrientDB.Db.prototype.getFulfillmentEvent = function() {
  return this.select('uuid as id, status, reason, createdAt, $author[0] as author')
    .let('author', function(s) {
      s
      .getUser()
      .from(function (s) {
        s
        .select('expand(out[@class = "User"])')
        .from('$parent.$current')
        .limit(1)
      })
      .limit(1)
    })
}

OrientDB.Statement.prototype.getFulfillmentEvent = function() {
  return this.select('uuid as id, status, reason, createdAt, $author[0] as author')
    .let('author', function(s) {
      s
      .getUser()
      .from(function (s) {
        s
        .select('expand(out[@class = "User"])')
        .from('$parent.$current')
        .limit(1)
      })
      .limit(1)
    })
}

OrientDB.Statement.prototype.inFulfillsFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in_Fulfills)')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
}

OrientDB.Statement.prototype.outFulfillsFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out_Fulfills)')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
}

OrientDB.Statement.prototype.outRequiresFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out("Requires"))')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
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
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
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
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
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
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
  .where({'@class': this.db.SMTINode})
}

OrientDB.Statement.prototype.outCollaboratesOnFromNode = function(id, role) {
  return this.from(function (s) {
    s
    .select('expand(in[@class = "Project"])')
    .from(function (s) {
      s
      .select('expand(out_CollaboratesOn)')
      .from(function (s) {
        s
        .select()
        .from('indexvalues:V.uuid ')
        .where({uuid: id})
        .limit(1)
      })
    })
    .where({
      role
    })
    .order('createdAt DESC')
  })
}

OrientDB.Statement.prototype.inCollaboratesOnFromNode = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in_CollaboratesOn)')
    .from(function (s) {
      s
      .select()
      .from('indexvalues:V.uuid ')
      .where({uuid: id})
      .limit(1)
    })
    .order('createdAt DESC')
  })
}

OrientDB.Statement.prototype.inTestCaseEvent = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in_TestCaseEvent)')
    .from('TestCase')
    .where({uuid: id})
    .order('createdAt DESC')
  })
}

OrientDB.Statement.prototype.inProjectEvent = function(id) {
  return this.from(function (s) {
    s
    .select('expand(in_ProjectEvent)')
    .from('Project')
    .where({uuid: id})
    .order('createdAt DESC')
  })
}

OrientDB.Statement.prototype.inFulfillmentEvent = function(id) {
  return this.from(function (s) {
    s
    .select('expand(out.in_FulfillmentEvent)')
    .from('Fulfills')
    .where({uuid: id})
    .order('createdAt DESC')
  })
}

export default OrientDB
