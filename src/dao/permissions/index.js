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
}

const roles = {
  owner: permissions.ADD_EDGE + permissions.UPDATE_NODE + permissions.DELETE_NODE,
}

const regExRoles = {
  updateNode: '1|3|5|7',
  deleteNode: '2|3|6|7',
  addEdge: '4|5|6|7',
}

export { permissions, roles, regExRoles };
