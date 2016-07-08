'use strict';

const _class = 'File';
import { SMTIValidator } from '../validator';
import { filteredObject, uuidToId } from '../../utilities';
import { roles, regExRoles } from '../permissions';

import {
  User
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
        .isContact()
        .then(({contact}) => {
          let email = contact.email;
          db
          .let('me', (s) => {
            s
            .select()
            .from('User')
            .where({
              uuid: userId
            })
          })
          .let('contact', (s) => {
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
          .let('knows', (s) => {
            s
            .create('edge', 'Knows')
            .from('$me')
            .to('$contact')
          })
          .let('newContact', (s) => {
            s
            .getUser()
            .from('$contact')
          })
          .let('newMe', (s) => {
            s
            .getUser()
            .from('$me')
          })
          .commit()
          .return(['$newContact', '$newMe'])
          .all()
          .then((result) => {
            let contact = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let me = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = moment(moment()).toISOString();

            resolve({
              contactEdge: {
                node: contact,
                cursor,
              },
              me
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
      var db = this.db;
      var targetId = this.targetId;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('me', (s) => {
        s
        .select()
        .from('User')
        .where({
          uuid: userId
        })
      })
      .let('contact', (s) => {
        s
        .select()
        .from('User')
        .where({
          uuid: targetId
        })
      })
      .let('knows', (s) => {
        s
        .delete('edge', 'Knows')
        .from('$me')
        .to('$contact')
      })
      .commit()
      .return(['$contact', '$me'])
      .all()
      .then((result) => {
        let contact = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let me = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
        contact = uuidToId(contact);
        me = uuidToId(me);
        let contactId = contact.id;

        resolve({
          deletedContactId: contactId,
          me
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

export default CoverDAO;
