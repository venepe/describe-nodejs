'use strict';

import { SMTIValidator } from '../validator';
import { filteredObject } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { collaboratorRoles } from '../../constants';
import moment from 'moment';

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
        events.publish(events.didDeleteProjectChannel(profileId, projectId), {
          deletedProjectId: projectId,
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
}

export default CollaborationDAO;
