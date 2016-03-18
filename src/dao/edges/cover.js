'use strict';

const _class = 'File';
const { SMTIValidator } = require('../validator');
const utilities = require('../../utilities');
import { roles, regExRoles } from '../permissions';
import { FileConfig } from '../../config';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';

import {
  File
} from '../model';

class CoverDAO {
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
              `_allow["${role}"] = ${roles.owner}`
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
          .let('covers', (s) => {
            s
            .create('edge', 'Covers')
            .from('$file')
            .to('$target')
          })
          .let('cursor', s => {
            s
            .select('inE(\'Covers\').size() as cursor')
            .from('V')
            .where({
              id: relationalId
            })
          })
          .commit()
          .return(['$file', '$cursor'])
          .all()
          .then((result) => {
            let node = utilities.FilteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[1].cursor);
            let coverImageEdge = {
              cursor,
              node
            };

            events.publish(`/target/${relationalId}/coverImages`, {
              target: {id: relationalId},
              coverImageEdge
            });

            resolve({
              target: {id: relationalId},
              coverImageEdge
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

  del() {
    return new Promise((resolve, reject) => {
      var del = require('del');
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('target', (s) => {
        s
        .select('*')
        .from(function (s) {
          s
          .select('expand(outE(\'Covers\').inV(\'Project|User\'))')
          .from('File')
          .where({
            id: targetId
          })
          .limit(1)
        })
        .limit(1)
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
      .let('coverImages', (s) => {
        s
        .select('expand(inE(\'Covers\').outV(\'File\'))')
        .from('$target')
        .order('createdAt DESC')
      })
      .let('coverImage', (s) => {
        s
        .getFile()
        .from('$coverImages')
        .limit(1)
      })
      .commit()
      .return('$coverImage')
      .one()
      .then((result) => {
        let payload = {};

        // TODO: return target
        let target = {id: null};
        if (result) {
          payload = {
            deletedCoverImageId: targetId,
            coverImageEdge: result,
            target
          };
        } else {
          let defaultCoverFile = {
            id: targetId,
            uri: FileConfig.DefaultImageUrl + targetId
          };

          payload = {
            deletedCoverImageId: targetId,
            coverImageEdge: defaultCoverFile,
            target
          }
        }

        events.publish(`/coverImages/${targetId}/delete`, payload);

        resolve(payload);
      })
      .catch((e) => {
        console.log(`orientdb error: ${e}`);
        reject();
      })
      .done();
    });
  }
}

export default CoverDAO;
