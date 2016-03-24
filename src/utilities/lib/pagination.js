'use strict';

import { cursorToOffset } from './cursor-to-offset';

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
    skip = (before > last) ? before - last : 0;
    limit = last;
  } else if (args.last && args.after) {
    skip = (after > limit) ? after - last : 0;
    limit = last;
    orderBy = 'createdAt DESC';
  }
  limit++;

  return {skip, limit, orderBy};
}

const Pagination = {
  getOrientDBPageFromGraphQL
}

export default Pagination;
