'use strict';

const _class = 'File';
import { SMTIValidator } from '../validator';
import { filteredObject, uuidToId } from '../../utilities';
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

  createUserCover(object) {
    return new Promise((resolve, reject) => {
      var db = this.db;
      var relationalId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      let validator = new SMTIValidator(object);

      validator
        .isCoverImage()
        .then(({coverImage, coverImageEvent}) => {
          db
          .let('target', (s) => {
            s
            .select()
            .from('indexvalues:V.uuid ')
            .where({
              uuid: relationalId
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
              uuid: userId
            })
            .where(
              `_allow["${role}"] = ${roles.owner}`
            )
          })
          .let('file', (s) => {
            s
            .create('vertex', 'File')
            .set(coverImage)
            .set('_allow = $target._allow[0]')
          })
          .let('coverImageEvent', (s) => {
            s
            .create('edge', 'CoverImageEvent')
            .from('$user')
            .to('$file')
            .set(coverImageEvent)
          })
          .let('covers', (s) => {
            s
            .create('edge', 'Covers')
            .from('$file')
            .to('$target')
          })
          .commit()
          .return(['$file'])
          .all()
          .then((result) => {
            let cover = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            cover = uuidToId(cover);

            // events.publish(events.didUpdateUserChannel(relationalId), {
            // user: {
            //   id: relationalId,
            //   cover
            // }
            // });

            resolve({
              user: {
                id: relationalId,
                cover
              }
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

  delUserCover() {
    return new Promise((resolve, reject) => {
      var targetId = this.targetId;
      var db = this.db;
      // var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('target', (s) => {
        s
        .select('*')
        .from(function (s) {
          s
          .select('expand(outE(\'Covers\').inV(\'User\'))')
          .from('File')
          .where({
            uuid: targetId
          })
          .limit(1)
        })
        .limit(1)
      })
      .let('deletes', (s) => {
        s
        .delete('VERTEX', _class)
        .where({
          uuid: targetId
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
      .then((cover) => {
        // TODO: return user insead of relying on context user object
        let user = {id: userId};

        if (cover) {
          user.cover = cover;
        } else {
          let defaultCoverFile = {
            id: user.id,
            uri: FileConfig.DefaultImageUrl + userId
          };

          user.cover = defaultCoverFile;
        }

        // events.publish(events.didUpdateUserChannel(user.id), {user});

        resolve({user});
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
