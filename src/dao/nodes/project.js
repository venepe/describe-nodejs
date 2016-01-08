'use strict';

const _class = 'Project';
const { SMTIValidator } = require('../validator');
const utilites = require('../../utilities');

import {
  Project
} from '../model';

class ProjectDAO {
  constructor(targetId, params) {
    this.targetId = targetId;
    this.params = params;
  }

  get() {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getProject()
      .from(_class)
      .where({id: id})
      .limit(1)
      .transform((record) => {
        let project = new Project();
        return utilites.FilteredObject(record, '@.*|rid', project);
      })
      .one()
      .then((record) => {
        resolve(record);
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  inEdgeRequired() {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getProject()
      .inRequiresFromNode(id)
      .limit(25)
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

  getEdgeCreated(args) {
    let pageObject = utilites.Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getProject()
      .outCreatesFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        return utilites.FilteredObject(record, '@.*|rid');
      })
      .all()
      .then((records) => {
        console.log(records);
        resolve(records);
      })
      .catch((e) => {
        reject();

      })
      .done();
    });
  }

  create(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      let relationalId = this.targetId;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      let validator = new SMTIValidator(object);

      validator
        .isProject()
        .then((object) => {
          db
          .let('user', (s) => {
            s
            .select()
            .from('User')
            .where({
              id: relationalId
            })
            .where(
              '_allow CONTAINS "' + role + '"'
            )
          })
          .let('project', (s) => {
            s
            .create('vertex', 'Project')
            .set(object)
            .set({_allow: [role]})
          })
          .let('creates', (s) => {
            s
            .create('edge', 'Creates')
            .from('$user')
            .to('$project')
          })
          .commit()
          .return('$project')
          .transform((record) => {
            return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
          })
          .one()
          .then((record) => {
            record.testCases = [];
            resolve(record);
          })
          .catch((e) => {
            console.log(`orientdb error: ${e}`);
            reject();
          })
          .done();
        })
        .catch((errors) => {
          reject(errors);
        });
    });
  }

  update(object) {
    return new Promise((resolve, reject) => {
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      let validator = new SMTIValidator(object, true);

      validator
        .isProject()
        .then((object) => {
          db
          .let('project', (s) => {
            s
            .select()
            .from(_class)
            .where({
              id: targetId
            })
            .where(
              '_allow CONTAINS "' + role + '"'
            )
          })
          .let('update', (s) => {
            s
            .update('$project')
            .set(object)
          })
          .let('newProject', (s) => {
            s
            .getProject()
            .from('$project')
          })
          .commit()
          .return('$newProject')
          .transform((record) => {
            return utilites.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
          })
          .one()
          .then((record) => {
            resolve(record);
          })
          .catch((e) => {
            console.log(`orientdb error: ${e}`);
            reject();
          })
          .done();
        })
        .catch((errors) => {
          reject(errors)
        });
    });
  }

  del() {
    return new Promise((resolve, reject) => {
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      db
      .delete('VERTEX', _class)
      .where({
        id: targetId
      })
      .where(
        '_allow CONTAINS "' + role + '"'
      )
      .one()
      .then(() => {
        resolve({id: targetId});
      })
      .catch((e) => {
        console.log(`orientdb error: ${e}`);
        reject();
      })
      .done();
    });
  }
}

export default ProjectDAO;
