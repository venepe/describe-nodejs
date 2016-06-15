'use strict';

import { SMTIValidator } from '../validator';
import { filteredObject, Pagination, GraphQLHelper, uuidToId } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor, toGlobalId } from 'graphql-relay';
import { collaboratorRoles } from '../../constants';

import {
  Message
} from '../model';

class MessageDAO {
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
      .getMessage()
      .from('Message')
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let message = new Message();
        return filteredObject(record, '@.*|rid', message);
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

  create({payload, channelType}) {
    return new Promise((resolve, reject) => {
      var db = this.db;
      var relationalId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      let validator = new SMTIValidator(payload);
      let expandStmt = '';
      if (channelType === 'Project') {
        expandStmt = '*';
      } else if (channelType === 'TestCase') {
        expandStmt = 'expand(inE("Requires").outV("Project"))';
      } else if (channelType === 'Fulfillment') {
        expandStmt = 'expand(outE("Fulfills").inV("TestCase").inE("Requires").outV("Project"))';
      }
      validator
        .isMessage()
        .then(({message}) => {
          db
          .let('channel', (s) => {
            s
            .select()
            .from('indexvalues:V.uuid')
            .where({
              uuid: relationalId
            })
            .where(
              `_allow["${role}"].asString() MATCHES "${regExRoles.addEdge}"`
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
          .let('message', (s) => {
            s
            .create('edge', 'Message')
            .from('$user')
            .to('$channel')
            .set(message)
          })
          .let('cursor', s => {
            s
            .select('inE(\'Message\').size() as cursor')
            .from('indexvalues:V.uuid')
            .where({
              uuid: relationalId
            })
          })
          .let('newMessage', (s) => {
            s
            .getMessage()
            .from('$message')
          })
          .let('newChannel', (s) => {
            s
            .select('inE(\'Message\').size() as numOfMessages, uuid as id')
            .from('$channel')
          })
          .let('project', (s) => {
            s
            .select('uuid as id')
            .from((s) => {
              s
              .select(expandStmt)
              .from('indexvalues:V.uuid')
              .where({uuid: relationalId})
            })
            .limit(1)
          })
          .commit()
          .return(['$newMessage', '$newChannel', '$cursor', '$project'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let channel = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[2].cursor);
            let projectId = result[3].id;

            channel.id = toGlobalId(channelType, channel.id)

            events.publish(events.didIntroduceMessageChannel(relationalId), {
              messageEdge: {
                cursor,
                node
              },
              channel
            });

            resolve({
              messageEdge: {
                cursor,
                node
              },
              channel
            });
          })
          .catch((e) => {
            console.log(`orientdb error: ${e}`);
            reject();
          })
          .done();
        })
        .catch((errors) => {
          console.log('rejected');
          console.log(errors);
          reject(errors);
        });
    });
  }

  // TODO: order by backwards pagination fails
  getEdgeMessages(args) {
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let userId = this.user.id;
      let db = this.db;
      let id = this.targetId;

      db
      .getMessage()
      .inMessageFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order('createdAt DESC')
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
}

export default MessageDAO;
