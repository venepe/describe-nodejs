'use strict';

import { SMTIValidator } from '../validator';
import { filteredObject } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';

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
          .select('uuid, role')
          .from('User')
          .where({
            email
          })
          .where(
            `not ( uuid = "${userId}" )`
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
                `not ( uuid = "${userId}" )`
              )
            })
            .let('project', (s) => {
              s
              .select()
              .getProject()
              .from('Project')
              .where({
                uuid: relationalId
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
              .set('_allow = $project._allow[0]')
            })
            .let('testCases', (s) => {
              s
              .select('expand(outE(\'Requires\').inV(\'TestCase\'))')
              .from('Project')
              .where({
                uuid: relationalId
              })
            })
            .let('cursor', s => {
              s
              .select('inE(\'CollaboratesOn\').size() as cursor')
              .from('Project')
              .where({
                uuid: relationalId
              })
              .where(
                `not ( id = "${userId}" )`
              )
            })
            .let('files', (s) => {
              s
              .select('expand(outE(\'Requires\').inV(\'TestCase\').inE(\'Fulfills\').inV(\'File\'))')
              .from('Project')
              .where({
                uuid: relationalId
              })
            })
            .let('coverImages', (s) => {
              s
              .select('expand(in(\'Covers\'))')
              .from('Project')
              .where({
                uuid: relationalId
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
            .let('updateCoverImages', (s) => {
              s
              .update(`$coverImages PUT _allow = "${collaboratorRole}", ${roles.owner}`)
            })
            .let('updateProject', (s) => {
              s
              .update(`$project PUT _allow = "${collaboratorRole}", ${roles.owner}`)
            })
            .let('updateCollaboratesOn', (s) => {
              s
              .update(`$collaborateson PUT _allow = "${collaboratorRole}", ${roles.owner}`)
            })
            .commit()
            .return(['$collaborator', '$project', '$cursor'])
            .all()
            .then((result) => {
              let collaborator = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
              let project = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
              let cursor = offsetToCursor(result[2].cursor);

              //Add collaborator to project
              events.publish(events.didIntroduceCollaboratorChannel(relationalId), {
                collaboratorEdge: {
                  node: collaborator,
                  cursor,
                },
                project
              });

              //Add collaboration to user
              events.publish(events.didIntroduceCollaborationChannel(collaborator.id), {
                collaborationEdge: project,
                me: collaborator
              });

              //Return the collaborator we added to the project
              resolve({
                collaboratorEdge: {
                  node: collaborator,
                  cursor,
                },
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
          uuid: projectId
        })
      })
      .let('collaborator', (s) => {
        s
        .select()
        .from('User')
        .where({
          uuid: targetId
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
          uuid: projectId
        })
      })
      .let('files', (s) => {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\').inE(\'Fulfills\').inV(\'File\'))')
        .from('Project')
        .where({
          uuid: projectId
        })
      })
      .let('coverImages', (s) => {
        s
        .select('expand(in(\'Covers\'))')
        .from('Project')
        .where({
          uuid: projectId
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
      .let('updateCoverImages', (s) => {
        s
        .update(`$coverImages REMOVE _allow = "${collaboratorRole}"`)
      })
      .let('updateProject', (s) => {
        s
        .update(`$project REMOVE _allow = "${collaboratorRole}"`)
      })
      .commit()
      .return('$project')
      .transform((record) => {
        return filteredObject(record, 'in_.*|out_.*|@.*|^_');
      })
      .one()
      .then((project) => {

        events.publish(events.didDeleteCollaboratorChannel(projectId, targetId), {
          deletedCollaboratorId: targetId,
          project
        });

        //Delete collaboration from user
        events.publish(events.didDeleteCollaborationChannel(targetId, projectId), {
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
