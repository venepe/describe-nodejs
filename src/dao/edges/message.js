'use strict';

import { SMTIValidator } from '../validator';
import { filteredObject, Pagination, GraphQLHelper, uuidToId } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { collaboratorRoles } from '../../constants';
import { push } from '../../notification';
import { toGlobalId } from 'graphql-relay';
import _ from 'lodash';

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
          .let('newMessage', (s) => {
            s
            .getMessage()
            .from('$message')
          })
          .let('newChannel', (s) => {
            s
            .select('uuid as id, text, numOfMessagesUnread')
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
          .return(['$newMessage', '$newChannel', '$project'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let channel = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = node.createdAt;
            let projectId = result[2].id;
            let numOfMessagesUnread = channel.numOfMessagesUnread || {};

            channel.id = toGlobalId(channelType, channel.id);

            const keys = Object.keys(numOfMessagesUnread);
            function publishIntroducedMessage(index = 0) {
              if (keys.length > index) {
                setTimeout(() => {
                  const role = keys[index];
                  const unreadMessages = numOfMessagesUnread[role];
                  channel.numOfMessagesUnread = unreadMessages;
                  events.publish(events.didIntroduceMessageChannel(role, relationalId), {
                    messageEdge: {
                      cursor,
                      node
                    },
                    channel
                  });
                  index++;
                  publishIntroducedMessage(index)
                }, 100);
              }
            }

            publishIntroducedMessage(0);

            //Start push notification
            let title = `${channel.text}`;
            let message = `${node.text}`;
            push(user, projectId, {title, message});
            //End push notification

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

  readChannel({channelType}) {
    return new Promise((resolve, reject) => {
      var db = this.db;
      var targetId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('channel', (s) => {
        s
        .select()
        .from('indexvalues:V.uuid')
        .where({
          uuid: targetId
        })
      })
      .let('updateChannel', (s) => {
        s
        .update(`$channel REMOVE numOfMessagesUnread = "${role}"`)
      })
      .commit()
      .return(['$channel'])
      .all()
      .then((result) => {
        let channel = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        channel = uuidToId(channel);
        channel.numOfMessagesUnread = 0;

        channel.id = toGlobalId(channelType, channel.id);

        resolve({
          channel
        });
      })
      .catch((e) => {
        console.log(`orientdb error: ${e}`);
        reject();
      })
      .done();
    });
  }

  // TODO: order by backwards pagination fails
  getEdgeMessages(args) {
    let pageObject = Pagination.getDescOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let userId = this.user.id;
      let db = this.db;
      let id = this.targetId;

      db
      .getMessage()
      .inMessageFromNode(id)
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
}

export default MessageDAO;
