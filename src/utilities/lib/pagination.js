'use strict';

const CursorToOffset = require('./cursor-to-offset');

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

function getOrientDBPageFromGraphQL(args) {
  let skip = 0;
  let limit = 25;
  let orderBy = 'createdAt DESC';

  let first = args.first || 0;
  let last = args.last || 0;
  let before = (args.before) ? CursorToOffset(args.before) : 0;
  let after = (args.after) ? CursorToOffset(args.after) : 0;

  if (args.first) {
    skip = (after >= before) ? after : (before > first) ? 0 : first - before;
    if (skip > 0) {
      skip++;
    }
    limit = first;
  } else if (args.last && args.before) {
    skip = (before > last) ? before - last : 0;
    limit = last;
  } else if (args.last && args.after) {
    skip = (after > limit) ? after - last : 0;
    limit = last;
    orderBy = 'createdAt ASC';
  }
  limit++;

  return {skip, limit, orderBy};
}

module.exports.getOrientDBPageFromGraphQL = getOrientDBPageFromGraphQL;
