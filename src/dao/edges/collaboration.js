'use strict';

const { SMTIValidator } = require('../validator');
const utilities = require('../../utilities');

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
            .set({_allow: [role]})
          })
          .let('projectDescendants', (s) => {
            s
            .select('expand(outE(\'Requires\').inV(\'TestCase\').inE(\'Fulfills\',\'Exemplifies\').inV(\'File\'))')
            .from('Project')
            .where({
              id: relationalId
            })
          })
          .let('updateProjectDescendants', (s) => {
            s
            .update('$projectDescendants ADD _allow = $collaborator.id')
          })
          .let('updateCollaborateson', (s) => {
            s
            .update('$collaborateson ADD _allow = $collaborator.id')
          })
          .commit()
          .return('$collaborator')
          .transform((record) => {
            return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
          })
          .one()
          .then((record) => {
            console.log(record);
            resolve(record);
          })
          .catch((e) => {
            console.log(`orientdb error: ${e}`);
            reject();
          })
          .done();
        })
        .catch((errors) => {
          console.log(errors);
          reject(errors);
        });
    });
  }

  del(projectId) {
    console.log('boom');
    return new Promise((resolve, reject) => {
      var del = require('del');
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      console.log(targetId);

      db
      .let('project', (s) => {
        s
        .select()
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
          deletedCollaboratorId: targetId,
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
