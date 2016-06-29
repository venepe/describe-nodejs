'use strict';

const _class = 'Project';
import { SMTIValidator } from '../validator';
import { filteredObject, Pagination, GraphQLHelper, uuidToId } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';
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

      db
      .getProject()
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

  getEdgeCreated(args = {}) {
    let pageObject = Pagination.getAscOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getProject()
      .outCollaboratesOnFromNode(id, 0)
      .where(
        pageObject.where
      )
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
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

  getEdgeCollaborations(args) {
    let pageObject = Pagination.getAscOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getProject()
      .select('in_CollaboratesOn.createdAt')
      .outCollaboratesOnFromNode(id, 1, pageObject.orderBy)
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
          .let('cursor', s => {
            s
            .select('outE(\'Creates\').size() as cursor')
            .from('User')
            .where({
              uuid: relationalId
            })
          })
          .commit()
          .return(['$project', '$cursor'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[1].cursor);
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
          .let('cursor', s => {
            s
            .select('in_ProjectEvent.size() as cursor')
            .from('$project')
          })
          .commit()
          .return(['$newProject', '$newProjectEvent', '$cursor'])
          .all()
          .then((result) => {
            let project = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let projectEvent = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[2].cursor);
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
}

export default ProjectDAO;
