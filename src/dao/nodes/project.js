'use strict';

const _class = 'Project';
import { SMTIValidator } from '../validator';
import { filteredObject, Pagination, GraphQLHelper, uuidToId } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { collaboratorRoles } from '../../constants';

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
      let role = this.user.role;

      db
      .getProject(role)
      .from(_class)
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let project = new Project();
        return filteredObject(record, '@.*|rid', project);
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

  getEdgeCollaborations(args) {
    let pageObject = Pagination.getDescOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user || {};
      let db = this.db;
      let id = this.targetId;
      let role = user.role;

      db
      .getProject(role)
      .outCollaboratesOnFromNode(id, pageObject.orderBy)
      .where(
        pageObject.where
      )
      .limit(pageObject.limit)
      .transform((record) => {
        let node = filteredObject(record, '@.*|rid');
        return {
          node,
          cursor: node.createdAt,
        };
      })
      .all()
      .then((edges) => {
        let payload = GraphQLHelper.connectionFromDbArray({edges, args});
        resolve(payload);
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
      let _allow = {};
      _allow[role] = roles.owner;

      let validator = new SMTIValidator(object);

      validator
        .isProject()
        .then(({project, projectEvent}) => {
          db
          .let('user', (s) => {
            s
            .select()
            .from('User')
            .where({
              uuid: relationalId
            })
            .where(
              `_allow["${role}"] = ${roles.owner}`
            )
          })
          .let('project', (s) => {
            s
            .create('vertex', 'Project')
            .set(project)
            .set({ _allow })
          })
          .let('projectEvent', (s) => {
            s
            .create('edge', 'ProjectEvent')
            .from('$user')
            .to('$project')
            .set(projectEvent)
          })
          .let('creates', (s) => {
            s
            .create('edge', 'Creates')
            .from('$user')
            .to('$project')
          })
          .let('collaborateson', (s) => {
            s
            .create('edge', 'CollaboratesOn')
            .from('$user')
            .to('$project')
            .set({ _allow })
            .set({role: collaboratorRoles.AUTHOR})
          })
          .commit()
          .return(['$project'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let cursor = node.createdAt;
            node = uuidToId(node);
            node.testCases = [];
            node.numOfTestCases = 0;
            node.numOfTestCasesFulfilled = 0;

            events.publish(events.didIntroduceProjectChannel(relationalId), {
              projectEdge: {
                cursor,
                node
              },
              me: {id: relationalId}
            });

            resolve({
              projectEdge: {
                cursor,
                node
              },
              me: {id: relationalId}
            });
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
        .then(({project, projectEvent}) => {
          db
          .let('project', (s) => {
            s
            .select()
            .from(_class)
            .where({
              uuid: targetId
            })
            .where(
              `_allow["${role}"].asString() MATCHES "${regExRoles.updateNode}"`
            )
          })
          .let('user', (s) => {
            s
            .select()
            .from('User')
            .where({
              uuid: userId
            })
            .where(
              `_allow["${role}"] = ${roles.owner}`
            )
          })
          .let('projectEvent', (s) => {
            s
            .create('edge', 'ProjectEvent')
            .from('$user')
            .to('$project')
            .set(projectEvent)
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
          .let('newProjectEvent', (s) => {
            s
            .getProjectEvent()
            .from('$projectEvent')
          })
          .commit()
          .return(['$newProject', '$newProjectEvent'])
          .all()
          .then((result) => {
            let project = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let projectEvent = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = newProjectEvent.createdAt;
            projectEvent = uuidToId(projectEvent);

            let projectEventEdge = {
              node: projectEvent,
              cursor
            }

            events.publish(events.didUpdateProjectChannel(targetId), {
              project,
              projectEventEdge
            });

            resolve({
              project,
              projectEventEdge
            });
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
        uuid: targetId
      })
      .where(
        `_allow["${role}"].asString() MATCHES "${regExRoles.deleteNode}"`
      )
      .one()
      .then(() => {
        events.publish(events.didDeleteProjectChannel(targetId), {
          deletedProjectId: targetId,
          me: {}
        });

        resolve({
          deletedProjectId: targetId,
          me: {id: userId}
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

        //Delete project from user
        events.publish(events.didDeleteProjectChannel(userId, projectId), {
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

export default ProjectDAO;
