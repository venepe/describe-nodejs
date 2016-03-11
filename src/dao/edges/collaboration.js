'use strict';

const { SMTIValidator } = require('../validator');
const utilities = require('../../utilities');
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';

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
      let _allow = {};
      _allow[role] = permissions.DELETE_NODE;

      let validator = new SMTIValidator(object);

      validator
        .isCollaborator()
        .then((object) => {
          let email = object.email;

          db
          .select('id, role')
          .from('User')
          .where({
            email
          })
          .where(
            `not ( id = "${userId}" )`
          )
          .limit(1)
          .one()
          .then((record) => {
            let collaboratorId = record.id
            let collaboratorRole = record.role

            db
            .let('collaborator', (s) => {
              s
              .select()
              .from('User')
              .where({
                email
              })
              .where(
                `not ( id = "${userId}" )`
              )
            })
            .let('project', (s) => {
              s
              .select()
              .getProject()
              .from('Project')
              .where({
                id: relationalId
              })
              .where(
                `_allow["${role}"] = ${roles.owner}`
              )
            })
            .let('collaborateson', (s) => {
              s
              .create('edge', 'CollaboratesOn')
              .from('$collaborator')
              .to('$project')
              .set({_allow})
            })
            .let('testCases', (s) => {
              s
              .select('expand(outE(\'Requires\').inV(\'TestCase\'))')
              .from('Project')
              .where({
                id: relationalId
              })
            })
            .let('files', (s) => {
              s
              .select('expand(outE(\'Requires\').inV(\'TestCase\').inE(\'Fulfills\',\'Exemplifies\').inV(\'File\'))')
              .from('Project')
              .where({
                id: relationalId
              })
            })
            .let('updateTestCases', (s) => {
              s
              .update(`$testCases PUT _allow = "${collaboratorRole}", ${roles.owner}`)
            })
            .let('updateFiles', (s) => {
              s
              .update(`$files PUT _allow = "${collaboratorRole}", ${roles.owner}`)
            })
            .let('updateProject', (s) => {
              s
              .update(`$project PUT _allow = "${collaboratorRole}", ${permissions.ADD_EDGE}`)
            })
            .let('updateCollaboratesOn', (s) => {
              s
              .update(`$collaborateson PUT _allow = "${collaboratorRole}", ${permissions.DELETE_NODE}`)
            })
            .commit()
            .return(['$collaborator', '$project'])
            .all()
            .then((result) => {
              let collaborator = utilities.FilteredObject(result[0], 'in_.*|out_.*|@.*|^_');
              let project = utilities.FilteredObject(result[1], 'in_.*|out_.*|@.*|^_');

              //Add collaborator to project
              events.publish(`/projects/${relationalId}/collaborators`, {
                collaboratorEdge: collaborator,
                project
              });

              //Add collaboration to user
              events.publish(`/users/${collaborator.id}/collaborations`, {
                collaborationEdge: project,
                me: collaborator
              });

              //Return the collaborator we added to the project
              resolve({
                collaboratorEdge: collaborator,
                project
              });
            })
            .catch((e) => {
              console.log(`orientdb error: ${e}`);
              reject();
            })
            .done();

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
    return new Promise((resolve, reject) => {
      var del = require('del');
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;
      let collaboratorRole = targetId.replace(/[-]/g, '_');

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
          `_allow["${role}"].asString() MATCHES "${regExRoles.deleteNode}"`
        )
      })
      .let('testCases', (s) => {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\'))')
        .from('Project')
        .where({
          id: projectId
        })
      })
      .let('files', (s) => {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\').inE(\'Fulfills\',\'Exemplifies\').inV(\'File\'))')
        .from('Project')
        .where({
          id: projectId
        })
      })
      .let('updateTestCases', (s) => {
        s
        .update(`$testCases REMOVE _allow = "${collaboratorRole}"`)
      })
      .let('updateFiles', (s) => {
        s
        .update(`$files REMOVE _allow = "${collaboratorRole}"`)
      })
      .let('updateProject', (s) => {
        s
        .update(`$project REMOVE _allow = "${collaboratorRole}"`)
      })
      .commit()
      .return('$project')
      .transform((record) => {
        return utilities.FilteredObject(record, 'in_.*|out_.*|@.*|^_');
      })
      .one()
      .then((project) => {

        events.publish(`/projects/${projectId}/collaborators/${targetId}/delete`, {
          deletedCollaboratorId: targetId,
          project
        });

        //Delete collaboration from user
        events.publish(`/users/${targetId}/collaborations/${projectId}/delete`, {
          deletedCollaborationId: projectId,
          me: {id: targetId}
        });

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
