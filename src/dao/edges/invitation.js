'use strict';

import { SMTIValidator } from '../validator';
import { filteredObject, Pagination, GraphQLHelper } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';
import { collaboratorRoles } from '../../constants';

import {
  Invitation
} from '../model';

class InvitationDAO {
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
      .getInvitation()
      .from('Invites')
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let invitation = new Invitation();
        return filteredObject(record, '@.*|rid', invitation);
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

  getEdgeInvitations(args) {
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getInvitation()
      .inInvitesFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        return filteredObject(record, '@.*|rid');
      })
      .all()
      .then((payload) => {
        let meta = GraphQLHelper.getMeta(pageObject, payload);
        resolve({
          payload,
          meta
        });
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
        .isInvitation()
        .then(({invitation}) => {
          let email = invitation.email;

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
            let inviteeId = record.uuid;
            let inviteeRole = record.role;

            db
            .let('invitee', (s) => {
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
            .let('invites', (s) => {
              s
              .create('edge', 'Invites')
              .from('$project')
              .to('$invitee')
              .set('_allow = $project._allow[0]')
              .set({
                role: collaboratorRoles.CONTRIBUTOR,
                sponsorId: userId
              })
            })
            .let('cursor', s => {
              s
              .select('inE(\'Invites\').size() as cursor')
              .from('User')
              .where({
                uuid: relationalId
              })
            })
            .let('updateInvites', (s) => {
              s
              .update(`$invites PUT _allow = "${inviteeRole}", ${roles.owner}`)
            })
            .let('newInvitation', (s) => {
              s
              .getInvitation()
              .from('$invites')
            })
            .let('newInvitee', (s) => {
              s
              .getInvitee()
              .from('$invites')
            })
            .let('sponsor', (s) => {
              s
              .getUser()
              .from('User')
              .where({
                uuid: userId
              })
            })
            .commit()
            .return(['$newInvitation', '$newInvitee', '$project', '$sponsor', '$cursor'])
            .all()
            .then((result) => {
              let invitation = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
              let invitee = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
              let project = filteredObject(result[2], 'in_.*|out_.*|@.*|^_');
              let sponsor = filteredObject(result[3], 'in_.*|out_.*|@.*|^_');
              let cursor = offsetToCursor(result[4].cursor);
              let profile = invitee.profile;

              invitation.sponsor = sponsor;

              // TODO: Add invitation to project
              events.publish(events.didIntroduceInviteeChannel(relationalId), {
                inviteeEdge: {
                  node: invitee,
                  cursor,
                },
                project
              });

              // Add invitation to invitee
              events.publish(events.didIntroduceInvitationChannel(inviteeId), {
                invitationEdge: invitation,
                me: profile
              });

              //Return the invitation we added to the project
              // TODO: get the correct cursor length
              resolve({
                inviteeEdge: {
                  node: invitee,
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

  accept() {
    return new Promise((resolve, reject) => {
      var db = this.db;
      var relationalId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('invitation', (s) => {
        s
        .select()
        .from('Invites')
        .where({
          uuid: relationalId
        })
        .where(
          `_allow["${role}"] = ${roles.owner}`
        )
      })
      .let('project', (s) => {
        s
        .select()
        .getProject()
        .from('Project')
        .where(
          '@rid = $invitation[0].out'
        )
      })
      .let('collaborator', (s) => {
        s
        .select()
        .from('User')
        .where({
          uuid: userId
        })
        .where(
          `_allow["${role}"] = ${roles.owner}`
        )
        .where(
          '@rid = $invitation[0].in'
        )
      })
      .let('collaborateson', (s) => {
        s
        .create('edge', 'CollaboratesOn')
        .from('$collaborator')
        .to('$project')
        .set('_allow = $project._allow[0]')
        .set('role = $invitation[0].role')
      })
      .let('testCases', (s) => {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\'))')
        .from('$project')
      })
      .let('cursor', s => {
        s
        .select('inE(\'CollaboratesOn\').size() as cursor')
        .from('$project')
        .where({
          role: 1
        })
      })
      .let('files', (s) => {
        s
        .select('expand(outE(\'Requires\').inV(\'TestCase\').inE(\'Fulfills\').inV(\'File\'))')
        .from('$project')
      })
      .let('updateTestCases', (s) => {
        s
        .update(`$testCases PUT _allow = "${role}", ${roles.owner}`)
      })
      .let('updateFiles', (s) => {
        s
        .update(`$files PUT _allow = "${role}", ${roles.owner}`)
      })
      .let('updateProject', (s) => {
        s
        .update(`$project PUT _allow = "${role}", ${roles.owner}`)
      })
      .let('updateCollaboratesOn', (s) => {
        s
        .update(`$collaborateson PUT _allow = "${role}", ${roles.owner}`)
      })
      .let('deletes', (s) => {
        s
        .delete('edge', 'Invites')
        .where({
          uuid: relationalId
        })
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
        let projectId = project.id;

        //Add collaborator to project
        events.publish(events.didIntroduceCollaboratorChannel(projectId), {
          collaboratorEdge: {
            node: collaborator,
            cursor,
          },
          project
        });

        // Add collaboration and acceptedInvitationId to user
        events.publish(events.didAcceptInvitationChannel(profile.id), {
          collaborationEdge: project,
          acceptedInvitationId: relationalId,
          me: profile
        });

        // Delete invitee from project
        events.publish(events.didDeleteInviteeChannel(projectId, relationalId), {
          deletedInviteeId: relationalId,
          project
        });

        //Return the collaboration we added to the user
        resolve({
          collaborationEdge: {
            node: project,
            cursor,
          },
          acceptedInvitationId: relationalId,
          me: profile
        });
      })
      .catch((e) => {
        console.log(`orientdb error: ${e}`);
        reject();
      })
      .done();

    });
  }

  decline() {
    return new Promise((resolve, reject) => {
      var db = this.db;
      var targetId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('invitation', (s) => {
        s
        .select()
        .from('Invites')
        .where({
          uuid: targetId
        })
        .where(
          `_allow["${role}"] = ${roles.owner}`
        )
      })
      .let('project', (s) => {
        s
        .select()
        .getProject()
        .from('Project')
        .where(
          '@rid = $invitation[0].out'
        )
      })
      .let('deletes', (s) => {
        s
        .delete('edge', 'Invites')
        .where({
          uuid: targetId
        })
      })
      .commit()
      .return(['$project'])
      .all()
      .then((result) => {
        let project = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let projectId = project.id;

        //Delete invitee from project
        events.publish(events.didDeleteInviteeChannel(projectId, targetId), {
          deletedInviteeId: targetId,
          project
        });

        //Decline invitation from user
        events.publish(events.didDeclineInvitationChannel(userId, targetId), {
          declinedInvitationId: targetId,
          me: {id: userId}
        });

        //Return the collaboration we added to the user
        resolve({
          declinedInvitationId: targetId,
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
      .let('invitee', (s) => {
        s
        .select('role, uuid')
        .from(function (s) {
          s
          .select('expand(in[@class = "User"])')
          .from(function (s) {
            s
            .select()
            .from('Invites')
            .where({
              uuid: targetId
            })
          })
          .limit(1)
        })
      })
      .let('deletes', (s) => {
        s
        .delete('edge', 'Invites')
        .where({
          uuid: targetId
        })
        .where(
          `_allow["${role}"].asString() MATCHES "${regExRoles.deleteNode}"`
        )
      })
      .commit()
      .return(['$project', '$invitee'])
      .all()
      .then((result) => {
        let project = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let invitee = result[1] || {};
        let inviteeId = invitee.uuid;
        let projectId = project.id;

        //Delete invitee from project
        events.publish(events.didDeleteInviteeChannel(projectId, targetId), {
          deletedInviteeId: targetId,
          project
        });

        //Decline invitation from user
        events.publish(events.didDeclineInvitationChannel(inviteeId, targetId), {
          declinedInvitationId: targetId,
          me: {id: inviteeId}
        });

        resolve({
          deletedInviteeId: targetId,
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

export default InvitationDAO;