'use strict';

import moment from 'moment';

// before > after
//
// after - before > 0
//
// first 3 after 1
// skip 1 limit 3 orderBy DESC
//
// first 1 before 4
// skip 1 - 4 limit 1 orderBy DESC
//
// last 1 before 5
// skip 5 - 1 limit 1 orderBy DESC
//
// last 3 after 1
// skip 1 - 3 limit 3 orderBy ASC

const getOrientDBPageFromGraphQL = (args) => {
  let skip = 0;
  let limit = 25;
  let orderBy = 'createdAt ASC';

  let first = args.first || 0;
  let last = args.last || 0;
  let before = (args.before) ? cursorToOffset(args.before) : 0;
  let after = (args.after) ? cursorToOffset(args.after) : 0;

  if (args.first) {
    skip = (after >= before) ? after : (before > first) ? 0 : first - before;
    if (skip > 0) {
      skip++;
    }
    limit = first;
  } else if (args.last && args.before) {
    skip = before;
    if (skip > 0) {
      skip++;
    }
    limit = last;
    orderBy = 'createdAt DESC';
  } else if (args.last && args.after) {
    skip = (after > limit) ? after - last : 0;
    limit = last;
    orderBy = 'createdAt DESC';
  } else if (args.last) {
    skip = 0;
    limit = last;
    orderBy = 'createdAt DESC';
  }
  limit++;

  return {skip, limit, orderBy};
}

const getAscOrientDBPageFromGraphQL = (args) => {
  const now = moment(moment()).toISOString();
  const past = '1970-01-01T00:00:00.000Z';
  let limit = 25;
  let orderBy = 'createdAt ASC';
  let where = `createdAt > "${past}"`;

  let first = args.first || 0;
  let last = args.last || 0;
  let after = args.after || past;
  let before = args.before || now;

  if (args.first) {
    where = `createdAt > "${after}"`;
    limit = first;
    orderBy = 'createdAt ASC';
  } else if (args.last) {
    limit = last;
    where = `createdAt < "${before}"`;
    orderBy = 'createdAt DESC';
  }

  return {where, limit, orderBy};
}

const getDescOrientDBPageFromGraphQL = (args) => {
  const now = moment(moment()).toISOString();
  const past = '1970-01-01T00:00:00.000Z';
  let limit = 25;
  let orderBy = 'createdAt DESC';
  let where = `createdAt < "${now}"`;

  let first = args.first || 0;
  let last = args.last || 0;
  let after = args.after || now;
  let before = args.before || past;

  if (args.first) {
    where = `createdAt < "${after}"`;
    limit = first;
    orderBy = 'createdAt DESC';
  } else if (args.last) {
    limit = last;
    where = `createdAt > "${before}"`;
    orderBy = 'createdAt ASC';
  }

  return {where, limit, orderBy};
}

const Pagination = {
  getAscOrientDBPageFromGraphQL,
  getDescOrientDBPageFromGraphQL,
  getOrientDBPageFromGraphQL
}

export default Pagination;
