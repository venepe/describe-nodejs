'use strict';

const { SMTIValidator } = require('../validator');
const utilites = require('../../utilities');

import {
  Project
} from '../model';

class CollaborationDAO {
  constructor(targetId, params) {
    this.targetId = targetId;
    this.params = params;
  }

  create(object) {
    return new Promise((resolve, reject) => {
      var db = this.db;
      var relationalId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      let validator = new SMTIValidator(object);

      validator
        .isCollaborator()
        .then((object) => {
          let email = object.email;
          db
          .let('collaborator', (s) => {
            s
            .select()
            .from('User')
            .where({
              email
            })
            .where(
              'not ( id = "' + userId + '")'
            )
          })
          .let('project', (s) => {
            s
            .select()
            .from('Project')
            .where({
              id: relationalId
            })
            .where(
              '_allow CONTAINS "' + role + '"'
            )
          })
          .let('collaborateson', (s) => {
            s
            .create('edge', 'CollaboratesOn')
            .from('$collaborator')
            .to('$project')
            .set({_allow: [role, collaboratorId]})
          })
          .commit()
          .return('$collaborator')
          .transform((record) => {
            return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
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
          reject(errors);
        });
    });
  }

  del(projectId) {
    return new Promise((resolve, reject) => {
      var del = require('del');
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('project', (s) => {
        s
        .getProject()
        .from('Project')
        .where({
          id: projectId
        })
      })
      .let('collaborator', (s) => {
        s
        .select()
        .from('User')
        .where({
          id: targetId
        })
      })
      .let('deletes', (s) => {
        s
        .delete('edge', 'CollaboratesOn')
        .from('$collaborator')
        .to('$project')
        .where(
          '_allow CONTAINS "' + role + '"'
        )
      })
      .commit()
      .return('$project')
      .transform((record) => {
        return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
      })
      .one()
      .then((project) => {
        resolve({
          deletedFulfillmentId: targetId,
          project
        });
      })
      .catch((e) => {
        console.log(`orientdb error: ${e}`);
        reject();
      })
      .done();
    });
  }
}

export default CollaborationDAO;
