'use strict';

import { SMTIValidator } from '../validator';
import { filteredObject, Pagination, GraphQLHelper, uuidToId } from '../../utilities';
import { roles, permissions, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';
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

  create(object) {
    return new Promise((resolve, reject) => {
      var db = this.db;
      var relationalId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      let validator = new SMTIValidator(object);

      validator
        .isMessage()
        .then(({message}) => {
          db
          .let('channel', (s) => {
            s
            .select()
            .from('indexvalues:V.uuid ')
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
            .from('TestCase')
            .where({
              uuid: relationalId
            })
          })
          .let('newMessage', (s) => {
            s
            .getMessage()
            .from('$message')
          })
          .commit()
          .return(['$newMessage', '$channel', '$cursor'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let channel = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[2].cursor);
            channel = uuidToId(channel);

            // events.publish(events.didUpdateUserChannel(relationalId), {
            // user: {
            //   id: relationalId,
            //   cover
            // }
            // });

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
      .order(pageObject.orderBy)
      .transform((record) => {
        return filteredObject(record, '@.*|rid');
      })
      .all()
      .then((payload) => {
        if (args.last) {
          payload.reverse();
        }
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
