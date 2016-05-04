'use strict';

const _class = 'TestCase';
import { SMTIValidator } from '../validator';
import { filteredObject, Pagination, GraphQLHelper, uuidToId } from '../../utilities';
import { roles, regExRoles } from '../permissions';
import * as events from '../../events';
import { offsetToCursor } from 'graphql-relay';
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
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
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

  getEdgeCreated(args) {
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getTestCase()
      .outCreatesFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
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

  getEdgeRequired(args) {
    let pageObject = Pagination.getOrientDBPageFromGraphQL(args);

    return new Promise((resolve, reject) => {
      let user = this.user;
      let db = this.db;
      let id = this.targetId;

      db
      .getTestCase()
      .outRequiresFromNode(id)
      .skip(pageObject.skip)
      .limit(pageObject.limit)
      .order(pageObject.orderBy)
      .transform((record) => {
        let isFulfilled = record.isFulfilled;
        record.isFulfilled = (isFulfilled.length > 0) ? true : false;
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

  create(object) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      let relationalId = this.targetId;
      let user = this.user;
      let userId = this.user.id;
      let role = this.user.role;

      let validator = new SMTIValidator(object);

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
          .let('cursor', s => {
            s
            .select('outE(\'Requires\').size() as cursor')
            .from('Project')
            .where({
              uuid: relationalId
            })
          })
          .commit()
          .return(['$testCase', '$project', '$cursor'])
          .all()
          .then((result) => {
            let node = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            node = uuidToId(node);
            node.isFulfilled = false;
            let project = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[2].cursor);
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
            let title = `Test case added to "${project.title}"`;
            let message = `It should "${node.it}"`;
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
          .let('cursor', s => {
            s
            .select('in_TestCaseEvent.size() as cursor')
            .from('$testCase')
          })
          .commit()
          .return(['$newTestCase', '$newTestCaseEvent', '$cursor'])
          .all()
          .then((result) => {
            let testCase = filteredObject(result[0], 'in_.*|out_.*|@.*|^_');
            let isFulfilled = testCase.isFulfilled;
            testCase.isFulfilled = (isFulfilled.length > 0) ? true : false;
            let testCaseEvent = filteredObject(result[1], 'in_.*|out_.*|@.*|^_');
            let cursor = offsetToCursor(result[2].cursor);
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
        .from(function (s) {
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
        if (testCase.isFulfilled.length > 0) {
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
