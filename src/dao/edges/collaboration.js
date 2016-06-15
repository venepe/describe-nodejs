'use strict';

import { SMTIValidator } from '../validator';
import { filteredObject } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';
import { collaboratorRoles } from '../../constants';

import {
  Collaborator
} from '../model';

class CollaborationDAO {
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
      .getCollaborator()
      .from('CollaboratesOn')
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let collaborator = new Collaborator();
        return filteredObject(record, '@.*|rid', collaborator);
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
        .then(({collaborator}) => {
          let email = collaborator.email;

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
            let collaboratorId = record.uuid;
            let collaboratorRole = record.role;

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
              .set({role: collaboratorRoles.CONTRIBUTOR})
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
              .select('expand(outE(\'Requires\').inV(\'TestCase\').inE(\'Fulfills\').outV(\'File\'))')
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
            .let('updateProject', (s) => {
              s
              .update(`$project PUT _allow = "${collaboratorRole}", ${roles.owner}`)
            })
            .let('updateCollaboratesOn', (s) => {
              s
              .update(`$collaborateson PUT _allow = "${collaboratorRole}", ${roles.owner}`)
            })
            .let('newCollaborator', (s) => {
              s
              .getCollaborator()
              .from('$collaborateson')
            })
            .commit()
            .return(['$newCollaborator', '$project', '$cursor'])
            .all()
            .then((result) => {
              let collaborator = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
              let project = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
              let cursor = offsetToCursor(result[2].cursor);
              let profile = collaborator.profile;

              //Add collaborator to project
              events.publish(events.didIntroduceCollaboratorChannel(relationalId), {
                collaboratorEdge: {
                  node: collaborator,
                  cursor,
                },
                project
              });

              //Add collaboration to user
              events.publish(events.didIntroduceCollaborationChannel(profile.id), {
                collaborationEdge: project,
                me: profile
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
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

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
      .let('profile', (s) => {
        s
        .select('role, uuid')
        .from((s) => {
          s
          .select('expand(out[@class = "User"])')
          .from((s) => {
            s
            .select()
            .from('CollaboratesOn')
            .where({
              uuid: targetId
            })
          })
          .limit(1)
        })
      })
      .let('deletes', (s) => {
        s
        .delete('edge', 'CollaboratesOn')
        .where({
          uuid: targetId
        })
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
      .let('updateTestCases', (s) => {
        s
        .update(`$testCases REMOVE _allow = $profile.role`)
      })
      .let('updateFiles', (s) => {
        s
        .update(`$files REMOVE _allow = $profile.role`)
      })
      .let('updateProject', (s) => {
        s
        .update(`$project REMOVE _allow = $profile.role`)
      })
      .commit()
      .return(['$project', '$profile'])
      .all()
      .then((result) => {
        let project = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let profile = result[1] || {};
        let profileId = profile.uuid;

        events.publish(events.didDeleteCollaboratorChannel(projectId, targetId), {
          deletedCollaboratorId: targetId,
          project
        });

        //Delete collaboration from user
        events.publish(events.didDeleteCollaborationChannel(profileId, projectId), {
          deletedCollaborationId: projectId,
          me: {id: profileId}
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

  leave() {
    return new Promise((resolve, reject) => {
      var projectId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

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
        .getCollaborator()
        .inCollaboratesOnFromNode(projectId)
        .where(
          `$profile[0].id = "${userId}"`
        )
        .limit(1)
      })
      .let('deletes', (s) => {
        s
        .delete('edge', 'CollaboratesOn')
        .from((s) => {
          s
          .select()
          .from('User')
          .where({
            uuid: userId
          })
        })
        .to((s) => {
          s
          .select()
          .from('Project')
          .where({
            uuid: projectId
          })
        })
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
      .let('updateTestCases', (s) => {
        s
        .update(`$testCases REMOVE _allow = "${role}"`)
      })
      .let('updateFiles', (s) => {
        s
        .update(`$files REMOVE _allow = "${role}"`)
      })
      .let('updateProject', (s) => {
        s
        .update(`$project REMOVE _allow = "${role}"`)
      })
      .commit()
      .return(['$project', '$collaborator'])
      .all()
      .then((result) => {
        let project = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let collaborator = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
        let collaboratorId = collaborator.id;

        events.publish(events.didDeleteCollaboratorChannel(projectId, collaboratorId), {
          deletedCollaboratorId: collaboratorId,
          project
        });

        //Delete collaboration from user
        events.publish(events.didDeleteCollaborationChannel(userId, projectId), {
          deletedCollaborationId: projectId,
          me: {id: userId}
        });

        resolve({
          deletedCollaboratorId: userId,
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
