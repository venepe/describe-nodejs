'use strict';

const _class = 'TestCase';
import { SMTIValidator } from '../validator';
import { filteredObject, Pagination, GraphQLHelper, uuidToId } from '../../utilities';
import { roles, regExRoles } from '../permissions';
import * as events from '../../events';
import { fulfillmentStatus } from '../../constants';
import { FileConfig } from '../../config';
import { push } from '../../notification';

import {
  TestCase
} from '../model';

class TestCaseDAO {
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
      .getTestCase()
      .from(_class)
      .where({uuid: id})
      .limit(1)
      .transform((record) => {
        let testCase = new TestCase();
        return filteredObject(record, '@.*|rid', testCase);
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

  getEdgeRequired(args) {
    let pageObject = Pagination.getAscOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getTestCase()
      .outRequiresFromNode(id)
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

  create(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      let relationalId = this.targetId;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      let validator = new SMTIValidator(object);
      let fulfillment = {
        status: fulfillmentStatus.INCOMPLETE,
        uri: FileConfig.FulfillmentImageUrl
      };

      validator
        .isTestCase()
        .then(({testCase, testCaseEvent}) => {
          db
          .let('project', (s) => {
            s
            .select('*')
            .getProject()
            .from('Project')
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
          .let('testCase', (s) => {
            s
            .create('vertex', 'TestCase')
            .set(testCase)
            .set('_allow = $project._allow[0]')
          })
          .let('testCaseEvent', (s) => {
            s
            .create('edge', 'TestCaseEvent')
            .from('$user')
            .to('$testCase')
            .set(testCaseEvent)
          })
          .let('requires', (s) => {
            s
            .create('edge', 'Requires')
            .from('$project')
            .to('$testCase')
          })
          .let('file', (s) => {
            s
            .create('vertex', 'File')
            .set({
              uri: fulfillment.uri
            })
            .set('_allow = $project._allow[0]')
          })
          .let('fulfillmentEvent', (s) => {
            s
            .create('edge', 'FulfillmentEvent')
            .from('$user')
            .to('$file')
            .set(fulfillment)
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
          .return(['$testCase', '$project'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            node = uuidToId(node);
            let project = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = node.createdAt;
            let numOfTestCases = project.numOfTestCases;
            numOfTestCases++;
            project.numOfTestCases = numOfTestCases;

            events.publish(events.didIntroduceTestCaseChannel(relationalId), {
              testCaseEdge: {
                cursor,
                node
              },
              project
            });

            events.publish(events.didUpdateProjectChannel(relationalId), {
              ...project
            });

            //Start push notification
            let title = `Test case added to "${project.text}"`;
            let message = `It should "${node.text}"`;
            push(user, relationalId, {title, message});
            //End push notification

            resolve({
              testCaseEdge: {
                cursor,
                node
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
        .catch((errors) => {
          console.log(errors);
          reject(errors);
        });
    });
  }

  update(object) {
    return new Promise((resolve, reject) => {
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      let validator = new SMTIValidator(object, true);

      validator
        .isTestCase()
        .then(({testCase, testCaseEvent}) => {
          db
          .let('testCase', (s) => {
            s
            .select()
            .from(_class)
            .where({
              uuid: targetId
            })
            .where(
              `_allow["${role}"].asString() MATCHES "${regExRoles.updateNode}"`
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
          .let('testCaseEvent', (s) => {
            s
            .create('edge', 'TestCaseEvent')
            .from('$user')
            .to('$testCase')
            .set(testCaseEvent)
          })
          .let('update', (s) => {
            s
            .update('$testCase')
            .set(testCase)
          })
          .let('newTestCase', (s) => {
            s
            .getTestCase()
            .from('$testCase')
          })
          .let('newTestCaseEvent', (s) => {
            s
            .getTestCaseEvent()
            .from('$testCaseEvent')
          })
          .commit()
          .return(['$newTestCase', '$newTestCaseEvent'])
          .all()
          .then((result) => {
            let testCase = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let testCaseEvent = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = testCaseEvent.createdAt;
            testCaseEvent = uuidToId(testCaseEvent);

            let testCaseEventEdge = {
              node: testCaseEvent,
              cursor
            }

            events.publish(events.didUpdateTestCaseChannel(targetId), {
                testCase,
                testCaseEventEdge
            });

            resolve({
                testCase,
                testCaseEventEdge
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
      let targetId = this.targetId;
      let db = this.db;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      db
      .let('testCase', (s) => {
        s
        .getTestCase()
        .from(_class)
        .where({
          uuid: targetId
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
            uuid: targetId
          })
          .limit(1)
        })
      })
      .let('delete', (s) => {
        s
        .delete('VERTEX', _class)
        .where({
          uuid: targetId
        })
        .where(
          `_allow["${role}"].asString() MATCHES "${regExRoles.deleteNode}"`
        )
      })
      .commit()
      .return(['$testCase', '$project'])
      .all()
      .then((result) => {
        let testCase = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
        let project = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
        let numOfTestCases = project.numOfTestCases;
        numOfTestCases--;
        project.numOfTestCases = numOfTestCases;
        if (testCase.status === fulfillmentStatus.SUBMITTED) {
          let numOfTestCasesFulfilled = project.numOfTestCasesFulfilled;
          numOfTestCasesFulfilled--;
          project.numOfTestCasesFulfilled = numOfTestCasesFulfilled;
        }

        events.publish(events.didDeleteTestCaseChannel(targetId), {
          deletedTestCaseId: targetId,
          project
        });

        events.publish(events.didUpdateProjectChannel(project.id), {
          ...project
        });

        resolve({
          deletedTestCaseId: targetId,
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

export default TestCaseDAO;
