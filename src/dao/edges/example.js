'use strict';

const _class = 'File';
import { SMTIValidator } from '../validator';
import { filteredObject } from '../../utilities';
import { roles, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';

import {
  File
} from '../model';

class ExampleDAO {
  constructor(targetId, params) {
    this.targetId = targetId;
    this.params = params;
  }

  create(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      let relationalId = this.targetId;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;
      let validator = new SMTIValidator(object);

      validator
        .isFile()
        .then((object) => {
          db
          .let('target', (s) => {
            s
            .select()
            .from('indexvalues:id')
            .where({
              id: relationalId
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
              id: userId
            })
            .where(
              `_allow["${role}"] = ${roles.owner}`
            )
          })
          .let('file', (s) => {
            s
            .create('vertex', 'File')
            .set(object)
            .set('_allow = $target._allow[0]')
          })
          .let('creates', (s) => {
            s
            .create('edge', 'Creates')
            .from('$user')
            .to('$file')
          })
          .let('exemplifies', (s) => {
            s
            .create('edge', 'Exemplifies')
            .from('$file')
            .to('$target')
          })
          .let('cursor', s => {
            s
            .select('inE(\'Fulfills\').size() as cursor')
            .from('TestCase')
            .where({
              id: relationalId
            })
          })
          .commit()
          .return(['$file', '$cursor'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[1].cursor);

            events.publish(events.didIntroduceExampleChannel(relationalId), {
                target: {id: relationalId},
                exampleEdge: {
                  cursor,
                  node
                },
            });

            resolve({
              target: {id: relationalId},
              exampleEdge: {
                cursor,
                node
              },
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

  del() {
    return new Promise((resolve, reject) => {
      let del = require('del');
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      db
      .let('targetId', (s) => {
        s
        .select('id')
        .from(function (s) {
          s
          .select('expand(out("Exemplifies"))')
          .from('File')
          .where({
            id: targetId
          })
          .limit(1)
        })
      })
      .let('deletes', (s) => {
        s
        .delete('VERTEX', _class)
        .where({
          id: targetId
        })
        .where(
          `_allow["${role}"].asString() MATCHES "${regExRoles.deleteNode}"`
        )
      })
      .commit()
      .return('$targetId')
      .one()
      .then((result) => {
        let id = result.id;

        events.publish(events.didDeleteExampleChannel(targetId), {
          deletedExampleId: targetId,
          target: {id}
        });

        resolve({
          deletedExampleId: targetId,
          target: {id}
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

export default ExampleDAO;
