'use strict';

import OrientDB from '../db';
import { OrientDbConfig, SumsetiDbConfig } from '../config';

import File from './nodes/file.js';
import Collaboration from './edges/collaboration.js';
import Cover from './edges/cover.js';
import Fulfillment from './edges/fulfillment.js';
import FulfillmentEvent from './events/fulfillment-event.js';
import Invitation from './edges/invitation.js';
import Message from './edges/message.js';
import Project from './nodes/project.js';
import ProjectEvent from './events/project-event.js';
import Search from './nodes/search.js';
import TestCase from './nodes/test-case.js';
import TestCaseEvent from './events/test-case-event.js';
import User from './nodes/user.js';
import UserAuthenticate from './nodes/user-authenticate.js';
const server = OrientDB(OrientDbConfig);

class DAO {
  constructor(user = {}) {
    this.user = user;
    this.db = server.use(SumsetiDbConfig);
  }

  File(targetId, params) {
    const fl = new File(targetId, params);
    fl.db = this.db;
    fl.user = this.user;
    return fl;
  }

  Collaboration(targetId, params) {
    const col = new Collaboration(targetId, params);
    col.db = this.db;
    col.user = this.user;
    return col;
  }

  Cover(targetId, params) {
    const cv = new Cover(targetId, params);
    cv.db = this.db;
    cv.user = this.user;
    return cv;
  }

  Fulfillment(targetId, params) {
    const ful = new Fulfillment(targetId, params);
    ful.db = this.db;
    ful.user = this.user;
    return ful;
  }

  FulfillmentEvent(targetId, params) {
    const fule = new FulfillmentEvent(targetId, params);
    fule.db = this.db;
    fule.user = this.user;
    return fule;
  }

  Invitation(targetId, params) {
    const invt = new Invitation(targetId, params);
    invt.db = this.db;
    invt.user = this.user;
    return invt;
  }

  Message(targetId, params) {
    const msg = new Message(targetId, params);
    msg.db = this.db;
    msg.user = this.user;
    return msg;
  }

  Project(targetId, params) {
    const pjt = new Project(targetId, params);
    pjt.db = this.db;
    pjt.user = this.user;
    return pjt;
  }

  ProjectEvent(targetId, params) {
    const pjte = new ProjectEvent(targetId, params);
    pjte.db = this.db;
    pjte.user = this.user;
    return pjte;
  }

  Search(query, params) {
    const srch = new Search(query, params);
    srch.db = this.db;
    srch.user = this.user;
    return srch;
  }

  TestCase(targetId, params) {
    const tc = new TestCase(targetId, params);
    tc.db = this.db;
    tc.user = this.user;
    return tc;
  }

  TestCaseEvent(targetId, params) {
    const tce = new TestCaseEvent(targetId, params);
    tce.db = this.db;
    tce.user = this.user;
    return tce;
  }

  UserAuthenticate() {
    const userAuth = new UserAuthenticate();
    userAuth.db = this.db;
    return userAuth;
  }

  User(targetId, params) {
    const user = new User(targetId, params);
    user.db = this.db;
    user.user = this.user;;
    return user;
  }

}
export default DAO;
