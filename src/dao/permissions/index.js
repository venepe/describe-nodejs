'use strict';

  /**
   *  0 - none
   *  1 - updateNode
   *  2 - deleteNode
   *  3 - updateNode/deleteNode
   *  4 - addEdge
   *  5 - addEdge/updateNode
   *  6 - addEdge/deleteNode
   *  7 - addEdge/updateNode/deleteNode
  */

const permissions = {
  NONE: 0,
  UPDATE_NODE: 1,
  DELETE_NODE: 2,
  ADD_EDGE: 4,
  REMOVE_EDGE: 8,
}

const roles = {
  owner: permissions.ADD_EDGE + permissions.UPDATE_NODE + permissions.DELETE_NODE + permissions.REMOVE_EDGE,
  contributor: permissions.ADD_EDGE,
}

const regExRoles = {
  updateNode: '1|3|5|7|15',
  deleteNode: '2|3|6|7|15',
  addEdge: '4|5|6|7|15',
  removeEdge: '8|9|10|12|15',
}

export { permissions, roles, regExRoles };
