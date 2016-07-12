'use strict';

const _class = 'File';
import { SMTIValidator } from '../validator';
import { filteredObject, uuidToId } from '../../utilities';
import { roles, regExRoles } from '../permissions';
import * as events from '../../events';
import { fulfillmentStatus } from '../../constants';
import { push } from '../../notification';
import moment from 'moment';

import {
  Fulfillment
} from '../model';

class FulfillmentDAO {
  constructor(targetId, params) {
    this.targetId = targetId;
    this.params = params;
  }

  get() {
    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;
      let role = this.user.role;

      db
      .getFulfillment(role)
      .from('File')
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let fulfillment = new Fulfillment();
        return filteredObject(record, '@.*|rid', fulfillment);
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
        .isFulfillment()
        .then(({fulfillment, fulfillmentEvent}) => {
          db
          .let('testCase', (s) => {
            s
            .select()
            .getTestCase()
            .from('TestCase')
            .where({
              uuid: relationalId
            })
            .where(
              `_allow["${role}"].asString() MATCHES "${regExRoles.addEdge}"`
            )
          })
          .let('project', (s) => {
            s
            .getProject()
            .from((s) => {
              s
              .select('expand(in("Requires"))')
              .from('TestCase')
              .where({
                uuid: relationalId
              })
              .limit(1)
            })
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
            .set({
              uri: fulfillment.uri
            })
            .set('_allow = $testCase._allow[0]')
          })
          .let('fulfillmentEvent', (s) => {
            s
            .create('edge', 'FulfillmentEvent')
            .from('$user')
            .to('$file')
            .set(fulfillmentEvent)
          })
          .let('fulfills', (s) => {
            s
            .create('edge', 'Fulfills')
            .from('$file')
            .to('$testCase')
            .set({
              status: fulfillment.status
            })
          })
          .commit()
          .return(['$file', '$fulfills', '$testCase', '$project'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in.*|out.*|@.*|^_');
            let fulfills = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let testCase = filteredObject(result[2], 'in_.*|out_.*|@.*|^_');
            let project = filteredObject(result[3], 'in_.*|out_.*|@.*|^_');
            let cursor = moment(moment()).toISOString();

            node = uuidToId(node);

            node.status = fulfills.status;

            if (testCase.status !== fulfillmentStatus.SUBMITTED) {
              let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
              numOfTestCasesFulfilled++;
              project.numOfTestCasesFulfilled = numOfTestCasesFulfilled;
            }

            testCase.status = fulfillmentStatus.SUBMITTED;

            events.publish(events.didIntroduceFulfillmentChannel(relationalId), {
              fulfillmentEdge: {
                cursor,
                node
              },
              testCase,
              project
            });

            events.publish(events.didUpdateTestCaseChannel(relationalId), {
              testCase
            });

            events.publish(events.didUpdateProjectChannel(project.id), {
              project
            });

            //Start push notification
            let title = `Fulfillment submitted for "${testCase.text}"`;
            let message = `${project.numOfTestCasesFulfilled}" / ${project.numOfTestCases}" test cases fulfilled`;
            push(user, project.id, {title, message});
            //End push notification

            resolve({
              fulfillmentEdge: {
                cursor,
                node
              },
              testCase,
              project
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

  update(testCaseId, object) {
    return new Promise((resolve, reject) => {
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      let validator = new SMTIValidator(object, true);

      validator
        .isFulfillment()
        .then(({fulfillment, fulfillmentEvent}) => {
          let file = {};
          if (fulfillment.uri) {
            file.uri = fulfillment.uri;
          }
          db
          .let('file', (s) => {
            s
            .select()
            .from('File')
            .where({
              uuid: targetId
            })
          })
          .let('fulfillment', (s) => {
            s
            .select('expand(outE("Fulfills"))')
            .from('$file')
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
          .let('fulfillmentEvent', (s) => {
            s
            .create('edge', 'FulfillmentEvent')
            .from('$user')
            .to('$file')
            .set(fulfillmentEvent)
          })
          .let('updateFulfillment', (s) => {
            s
            .update('$fulfillment')
            .set({
              status: fulfillment.status
            })
          })
          .let('updateFile', (s) => {
            s
            .update('$file')
            .set(file)
          })
          .let('newFulfillment', (s) => {
            s
            .getFulfillment()
            .from('$file')
          })
          .let('newFulfillmentEvent', (s) => {
            s
            .getFulfillmentEvent()
            .from('$fulfillmentEvent')
          })
          .let('testCase', (s) => {
            s
            .select()
            .getTestCase()
            .from('TestCase')
            .where({
              uuid: testCaseId
            })
          })
          .let('project', (s) => {
            s
            .getProject()
            .from((s) => {
              s
              .select('expand(in("Requires"))')
              .from('TestCase')
              .where({
                uuid: testCaseId
              })
              .limit(1)
            })
          })
          .commit()
          .return(['$newFulfillment', '$testCase', '$project', '$newFulfillmentEvent'])
          .all()
          .then((result) => {
            let fulfillment = filteredObject(result[0], 'in.*|out.*|@.*|^_');
            let testCase = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let project = filteredObject(result[2], 'in_.*|out_.*|@.*|^_');
            let fulfillmentEvent = filteredObject(result[3], 'in_.*|out_.*|@.*|^_');
            let cursor = fulfillmentEvent.createdAt;

            let fulfillmentEventEdge = {
              node: fulfillmentEvent,
              cursor
            };

            testCase = uuidToId(testCase);

            testCase.status = fulfillment.status;

            events.publish(events.didUpdateFulfillmentChannel(targetId), {
              fulfillment,
              fulfillmentEventEdge,
              testCase,
              project
            });

            events.publish(events.didUpdateTestCaseChannel(testCaseId), {
              testCase
            });

            events.publish(events.didUpdateProjectChannel(project.id), {
              project
            });

            //Start push notification
            let status = 'updated';
            let statusEnum = fulfillment.status;
            if (statusEnum === fulfillmentStatus.SUBMITTED) {
              status = 'submitted';
            } else if (statusEnum === fulfillmentStatus.REJECTED) {
              status = 'rejected';
            }
            let title = `Fulfillment ${status} for "${testCase.text}"`;
            let message = `${project.numOfTestCasesFulfilled} / ${project.numOfTestCases} test cases fulfilled`;
            push(user, project.id, {title, message});
            //End push notification

            resolve({
              fulfillment,
              fulfillmentEventEdge,
              testCase,
              project
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
}

export default FulfillmentDAO;
