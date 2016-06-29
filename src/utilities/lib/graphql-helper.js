'use strict';

const getMeta = (pageObject, payload) => {
  let sliceStart = pageObject.skip;
  let arrayLength = sliceStart + payload.length;
  return {
    sliceStart,
    arrayLength
  };
}

const connectionFromDbArray = ({edges = [], args = {}}) => {
  let firstEdge = (edges.length > 0) ? edges[0] : null;
  let lastEdge = (edges.length > 0) ? edges[edges.length - 1] : null;
  let hasNextPage = (edges.length === args.first) ? true : false;
  let hasPreviousPage = (edges.length === args.last) ? true : false;
  if (args.last) {
    edges = edges.reverse();
  }

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: firstEdge ? firstEdge.cursor : null,
      endCursor: lastEdge ? lastEdge.cursor : null
    }
  };
}

const GraphQLHelper = {
  getMeta,
  connectionFromDbArray
}

export default GraphQLHelper;
