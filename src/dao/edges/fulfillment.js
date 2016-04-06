'use strict';

const _class = 'File';
import { SMTIValidator } from '../validator';
import { filteredObject, uuidToId } from '../../utilities';
import { roles, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';

import {
  File
} from '../model';

class FulfillmentDAO {
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
            .from(function (s) {
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
            .set(fulfillment)
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
          })
          .let('cursor', s => {
            s
            .select('inE(\'Fulfills\').size() as cursor')
            .from('TestCase')
            .where({
              uuid: relationalId
            })
          })
          .commit()
          .return(['$file', '$testCase', '$project', '$cursor'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let testCase = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let project = filteredObject(result[2], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[3].cursor);

            node = uuidToId(node);

            if (testCase.isFulfilled.length === 0) {
              let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
              numOfTestCasesFulfilled++;
              project.numOfTestCasesFulfilled = numOfTestCasesFulfilled;
            }

            testCase.isFulfilled = true;

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

  reject(testCaseId) {
    return new Promise((resolve, reject) => {
      var targetId = this.targetId;
      var db = this.db;
      var user = this.user;
      var userId = this.user.id;
      var role = this.user.role;

      db
      .let('testCase', (s) => {
        s
        .select()
        .from('TestCase')
        .where({
          uuid: testCaseId
        })
      })
      .let('project', (s) => {
        s
        .getProject()
        .from(function (s) {
          s
          .select('expand(in("Requires"))')
          .from('TestCase')
          .where({
            uuid: testCaseId
          })
          .limit(1)
        })
      })
      .let('file', (s) => {
        s
        .select()
        .from('File')
        .where({
          uuid: targetId
        })
        .where(
          `_allow["${role}"].asString() MATCHES "${regExRoles.deleteNode}"`
        )
      })
      .let('deletes', (s) => {
        s
        .delete('EDGE', 'Fulfills')
        .from('$file')
        .to('$testCase')
      })
      .let('fulfills', (s) => {
        s
        .create('edge', 'Rejects')
        .from('$file')
        .to('$testCase')
      })
      .let('cursor', s => {
        s
        .select('inE(\'Rejects\').size() as cursor')
        .from('TestCase')
        .where({
          uuid: testCaseId
        })
      })
      .commit()
      .return(['$file', '$testCase', '$project', '$cursor'])
      .all()
      .then((result) => {
        let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let testCase = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
        let project = filteredObject(result[2], 'in_.*|out_.*|@.*|^_');
        let cursor = offsetToCursor(result[3].cursor);

        let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
        let isFulfilled = testCase.isFulfilled;

        node = uuidToId(node);
        testCase = uuidToId(testCase);

        //Because the test case is pull before the fulfillment is deleted
        testCase.isFulfilled = (isFulfilled.length > 1) ? true : false;
        if (!testCase.isFulfilled) {
          let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
          numOfTestCasesFulfilled--;
          project.numOfTestCasesFulfilled = numOfTestCasesFulfilled;
        }

        events.publish(events.didRejectFulfillmentChannel(testCaseId, targetId), {
          rejectedFulfillmentId: targetId,
          rejectionEdge: {
            cursor,
            node
          },
          testCase,
          project
        });

        events.publish(events.didUpdateTestCaseChannel(testCaseId), {
          testCase
        });

        events.publish(events.didUpdateProjectChannel(project.id), {
          project
        });

        resolve({
          rejectedFulfillmentId: targetId,
          rejectionEdge: {
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
    });
  }
}

export default FulfillmentDAO;
