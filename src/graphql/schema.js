'use strict';

const dao = require('../dao');

import {
  graphql,
  GraphQLID,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArraySlice,
  connectionFromPromisedArray,
  cursorForObjectInConnection,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
  toGlobalId,
} from 'graphql-relay';

import {
  File,
  Project,
  TestCase,
  User,
} from '../dao/model';

var {nodeInterface, nodeField} = nodeDefinitions(
  (globalId, context) => {
    var {type, id} = fromGlobalId(globalId);
    var user = context.rootValue.user;

    if (type === 'Project') {
      return dao(user).Project(id).get();
    } else if (type === 'TestCase') {
      return dao(user).TestCase(id).get();
    } else if (type === 'File') {
      return dao(user).File(id).get();
    } else if (type === 'User') {
      return dao(user).User(id).get();
    } else {
      return null;
    }
  },
  (obj) => {

    if (obj instanceof Project) {
      return projectType;
    } else if (obj instanceof TestCase) {
      return testCaseType;
    } else if (obj instanceof File) {
      return fileType;
    } else if (obj instanceof User) {
      return userType;
    } else {
      return null;
    }
  }
);

let userType = new GraphQLObjectType({
  name: 'User',
  description: 'User object',
  fields: () => ({
    id: globalIdField('User'),
    name: {
      type: GraphQLString,
      description: 'The handle of the user.',
    },
    fullName: {
      type: GraphQLString,
      description: 'The full name of the user.',
    },
    summary: {
      type: GraphQLString,
      description: 'The summary of the user.',
    },
    email: {
      type: GraphQLString,
      description: 'The email of the user.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the user was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the user was last updated.',
    },
    coverImages: {
      type: coverImageConnection,
      description: 'The cover images of the user.',
      args: connectionArgs,
      resolve: (user, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).File(user.id).getEdgeCovered(args)
        ,
        args
      ),
    },
    projects: {
      type: projectConnection,
      description: 'The projects created by the user.',
      args: connectionArgs,
      resolve: (user, args, context) => {
        return new Promise((resolve, reject) => {
          dao(context.rootValue.user).Project(user.id).getEdgeCreated(args).then((result) => {
            resolve(connectionFromArraySlice(result.payload, args, result.meta));
          })
          .catch((e) => {
            reject(e);
          })
        });
      }
    },
    collaborations: {
      type: projectConnection,
      description: 'The projects the user is collaborating on.',
      args: connectionArgs,
      resolve: (user, args, context) => {
        return new Promise((resolve, reject) => {
          dao(context.rootValue.user).Project(user.id).getEdgeCollaborations(args).then((result) => {
            console.log(result);
            resolve(connectionFromArraySlice(result.payload, args, result.meta));
          })
          .catch((e) => {
            reject(e);
          })
        });
      }
    }
  }),
  interfaces: [nodeInterface],
});

let projectType = new GraphQLObjectType({
  name: 'Project',
  description: 'Project object',
  fields: () => ({
    id: globalIdField('Project'),
    title: {
      type: GraphQLString,
      description: 'The title of the project.',
    },
    numOfTestCases: {
      type: GraphQLInt,
      description: 'The total number of test cases for the project.',
    },
    numOfTestCasesFulfilled: {
      type: GraphQLInt,
      description: 'The total number of test cases fulfilled for the project.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the project was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the project was last updated.',
    },
    testCases: {
      type: testCaseConnection,
      description: 'The test cases of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => {
        return new Promise((resolve, reject) => {
          dao(context.rootValue.user).TestCase(project.id).getEdgeRequired(args).then((result) => {
            resolve(connectionFromArraySlice(result.payload, args, result.meta));
          })
          .catch((e) => {
            reject(e);
          })
        });
      }
    },
    coverImages: {
      type: coverImageConnection,
      description: 'The cover images of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).File(project.id).getEdgeCovered(args)
        ,
        args
      ),
    },
    collaborators: {
      type: userConnection,
      description: 'The collaborators of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => {
        return new Promise((resolve, reject) => {
          dao(context.rootValue.user).User(project.id).getEdgeCollaborators(args).then((result) => {
            resolve(connectionFromArraySlice(result.payload, args, result.meta));
          })
          .catch((e) => {
            reject(e);
          })
        });
      }
    },
  }),
  interfaces: [nodeInterface],
});

let testCaseType = new GraphQLObjectType({
  name: 'TestCase',
  description: 'Test case object',
  fields: () => ({
    id: globalIdField('TestCase'),
    it: {
      type: GraphQLString,
      description: 'The \"it\" or what a test case should do.',
    },
    isFulfilled: {
      type: GraphQLBoolean,
      description: 'Whether the test case is fulfilled.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the test case was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the test case was last updated.',
    },
    examples: {
      type: exampleConnection,
      description: 'The files exemplifying the test case.',
      args: connectionArgs,
      resolve: (testCase, args, context) => {
        return new Promise((resolve, reject) => {
          dao(context.rootValue.user).File(testCase.id).getEdgeExemplifies(args).then((result) => {
            resolve(connectionFromArraySlice(result.payload, args, result.meta));
          })
          .catch((e) => {
            reject(e);
          })
        });
      }
    },
    fulfillments: {
      type: fulfillConnection,
      description: 'The files fulfilling the test case.',
      args: connectionArgs,
      resolve: (testCase, args, context) => {
        return new Promise((resolve, reject) => {
          dao(context.rootValue.user).File(testCase.id).inEdgeFulfilled(args).then((result) => {
            resolve(connectionFromArraySlice(result.payload, args, result.meta));
          })
          .catch((e) => {
            reject(e);
          })
        });
      }
    }
  }),
  interfaces: [nodeInterface],
});


let fileType = new GraphQLObjectType({
  name: 'File',
  description: 'File object',
  fields: () => ({
    id: globalIdField('File'),
    uri: {
      type: GraphQLString,
      description: 'The uri of the file.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the file was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the file was last updated.',
    }
  }),
  interfaces: [nodeInterface],
});

var {connectionType: testCaseConnection, edgeType: GraphQLTestCaseEdge} =
  connectionDefinitions({name: 'TestCase', nodeType: testCaseType});

var {connectionType: projectConnection, edgeType: GraphQLProjectEdge} =
  connectionDefinitions({name: 'Project', nodeType: projectType});

var {connectionType: exampleConnection, edgeType: GraphQLExampleEdge} =
  connectionDefinitions({name: 'Examples', nodeType: fileType});

var {connectionType: coverImageConnection, edgeType: GraphQLCoverImageEdge} =
  connectionDefinitions({name: 'CoverImages', nodeType: fileType});

var {connectionType: fulfillConnection, edgeType: GraphQLFulfillEdge} =
  connectionDefinitions({name: 'Fulfills', nodeType: fileType});

var {connectionType: userConnection, edgeType: GraphQLUserEdge} =
  connectionDefinitions({name: 'Users', nodeType: userType});

var updateUser = mutationWithClientMutationId({
  name: 'UpdateUser',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    name: {
      type: GraphQLString,
      description: 'The handle of the user.',
    },
    fullName: {
      type: GraphQLString,
      description: 'The full name of the user.',
    },
    summary: {
      type: GraphQLString,
      description: 'The summary of the user.',
    }
  },
  outputFields: {
    user: {
      type: userType,
      resolve: (payload) => payload
    }
  },
  mutateAndGetPayload: ({id, name, fullName, summary}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).User(localId).update({name, fullName, summary});
  }
});

var deleteUser = mutationWithClientMutationId({
  name: 'DeleteUser',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedUserId: {
      type: GraphQLID,
      resolve: ({id}) => id,
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).User(localId).del().then(function (data) {
      return {id};
    });
  }
});

var introduceProject = mutationWithClientMutationId({
  name: 'IntroduceProject',
  inputFields: {
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The title of the project.',
    }
  },
  outputFields: {
    projectEdge: {
      type: GraphQLProjectEdge,
      resolve: (payload) => {
        return {
          cursor: cursorForObjectInConnection([payload], payload),
          node: payload,
        };
      }
    },
    me: {
      type: userType,
      resolve: () => {},
    },
  },
  mutateAndGetPayload: ({targetId, title}, context) => {
    var localId = fromGlobalId(targetId).id;
    return dao(context.rootValue.user).Project(localId).create({title});
  }
});

var introduceFulfillment = mutationWithClientMutationId({
  name: 'IntroduceFulfillment',
  inputFields: {
    testCaseId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The uri of the file.',
    }
  },
  outputFields: {
    fulfillmentEdge: {
      type: GraphQLFulfillEdge,
      resolve: (payload) => {
        var file = payload.file;
        return {
          cursor: cursorForObjectInConnection([file], file),
          node: file,
        };
      }
    },
    testCase: {
      type: testCaseType,
      resolve: (payload) => {
        return payload.testCase;
      },
    },
    project: {
      type: projectType,
      resolve: (payload) => {
        return payload.project;
      },
    },
  },
  mutateAndGetPayload: ({testCaseId, uri}, context) => {
    var localId = fromGlobalId(testCaseId).id;
    return dao(context.rootValue.user).Fulfillment(localId).create({uri});
  }
});

var updateProject = mutationWithClientMutationId({
  name: 'UpdateProject',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The title of the project.',
    }
  },
  outputFields: {
    project: {
      type: projectType,
      resolve: (payload) => payload
    }
  },
  mutateAndGetPayload: ({id, title}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).Project(localId).update({title});
  }
});

var deleteProject = mutationWithClientMutationId({
  name: 'DeleteProject',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedProjectId: {
      type: GraphQLID,
      resolve: ({id}) => id,
    },
    me: {
      type: userType,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).Project(localId).del().then(function (data) {
      return {id};
    });
  }
});

var introduceTestCase = mutationWithClientMutationId({
  name: 'IntroduceTestCase',
  inputFields: {
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    it: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'What it should do.',
    }
  },
  outputFields: {
    testCaseEdge: {
      type: GraphQLTestCaseEdge,
      resolve: (payload) => {
        var testCase = payload.testCase;
        return {
          cursor: cursorForObjectInConnection([testCase], testCase),
          node: testCase,
        };
      }
    },
    project: {
      type: projectType,
      resolve: (payload) => {
        return payload.project;
      },
    },
  },
  mutateAndGetPayload: ({targetId, it}, context) => {
    var localId = fromGlobalId(targetId).id;
    return dao(context.rootValue.user).TestCase(localId).create({it});
  }
});

var updateTestCase = mutationWithClientMutationId({
  name: 'UpdateTestCase',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    it: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'What it should do.',
    }
  },
  outputFields: {
    testCase: {
      type: testCaseType,
      resolve: (payload) => payload
    }
  },
  mutateAndGetPayload: ({id, it}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).TestCase(localId).update({it});
  }
});

var deleteTestCase = mutationWithClientMutationId({
  name: 'DeleteTestCase',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedTestCaseId: {
      type: GraphQLID,
      resolve: (payload) => {
        return payload.deletedTestCaseId;
      },
    },
    project: {
      type: projectType,
      resolve: (payload) => {
        return payload.project;
      },
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).TestCase(localId).del();
  }
});

var introduceExample = mutationWithClientMutationId({
  name: 'IntroduceExample',
  inputFields: {
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The uri of the file.',
    }
  },
  outputFields: {
    exampleEdge: {
      type: GraphQLExampleEdge,
      resolve: (payload) => {
        return {
          cursor: cursorForObjectInConnection([payload], payload),
          node: payload,
        };
      }
    },
    target: {
      type: nodeInterface,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({targetId, uri}, context) => {
    var localId = fromGlobalId(targetId).id;
    return dao(context.rootValue.user).Example(localId).create({uri});
  }
});

var deleteFulfillment = mutationWithClientMutationId({
  name: 'DeleteFulfillment',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    testCaseId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedFulfillmentId: {
      type: GraphQLID,
      resolve: (payload) => {
        return payload.deletedFulfillmentId;
      },
    },
    testCase: {
      type: testCaseType,
      resolve: (payload) => {
        return payload.testCase;
      },
    },
    project: {
      type: projectType,
      resolve: (payload) => {
        return payload.project;
      },
    },
  },
  mutateAndGetPayload: ({id, testCaseId}, context) => {
    var localId = fromGlobalId(id).id;
    var localTestCaseId = fromGlobalId(testCaseId).id;
    return dao(context.rootValue.user).Fulfillment(localId).del(localTestCaseId);
  }
});

var deleteExample = mutationWithClientMutationId({
  name: 'DeleteExample',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedExampleId: {
      type: GraphQLID,
      resolve: ({id}) => id,
    },
    target: {
      type: nodeInterface,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).Example(localId).del().then(function (data) {
      return {id};
    });
  }
});

var introduceCoverImage = mutationWithClientMutationId({
  name: 'IntroduceCoverImage',
  inputFields: {
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The uri of the file.',
    }
  },
  outputFields: {
    coverImageEdge: {
      type: GraphQLCoverImageEdge,
      resolve: (payload) => {
        return {
          cursor: cursorForObjectInConnection([payload], payload),
          node: payload,
        };
      }
    },
    target: {
      type: nodeInterface,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({targetId, uri}, context) => {
    var localId = fromGlobalId(targetId).id;
    return dao(context.rootValue.user).Cover(localId).create({uri});
  }
});

var deleteCoverImage = mutationWithClientMutationId({
  name: 'DeleteCoverImage',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedCoverImageId: {
      type: GraphQLID,
      resolve: ({id}) => id,
    },
    target: {
      type: nodeInterface,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).Cover(localId).del().then(function (data) {
      return {id};
    });
  }
});

var introduceCollaborator = mutationWithClientMutationId({
  name: 'IntroduceCollaborator',
  inputFields: {
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The email of the collaborator.',
    }
  },
  outputFields: {
    collaboratorEdge: {
      type: GraphQLUserEdge,
      resolve: (payload) => {
        return {
          cursor: cursorForObjectInConnection([payload], payload),
          node: payload,
        };
      }
    },
    project: {
      type: nodeInterface,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({projectId, email}, context) => {
    var localId = fromGlobalId(projectId).id;
    return dao(context.rootValue.user).Collaboration(localId).create({email});
  }
});

var deleteCollaborator = mutationWithClientMutationId({
  name: 'DeleteCollaborator',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedCollaboratorId: {
      type: GraphQLID,
      resolve: (payload) => {
        return payload.deletedCollaboratorId;
      },
    },
    project: {
      type: projectType,
      resolve: (payload) => {
        return payload.project;
      },
    },
  },
  mutateAndGetPayload: ({id, projectId}, context) => {
    var localId = fromGlobalId(id).id;
    var localProjectId = fromGlobalId(projectId).id;
    return dao(context.rootValue.user).Collaboration(localId).del(localProjectId);
  }
});

var schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      me: {
        type: userType,
        args: {},
        resolve: (root, {}) => {
          return dao(root.user).Me().get();
        }
      },
      node: nodeField
    }
  }),

  // mutation
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      updateUser: updateUser,
      deleteUser: deleteUser,
      introduceProject: introduceProject,
      introduceFulfillment: introduceFulfillment,
      updateProject: updateProject,
      deleteProject: deleteProject,
      introduceTestCase: introduceTestCase,
      updateTestCase: updateTestCase,
      deleteTestCase: deleteTestCase,
      introduceExample: introduceExample,
      deleteExample: deleteExample,
      deleteFulfillment: deleteFulfillment,
      deleteCoverImage: deleteCoverImage,
      introduceCoverImage: introduceCoverImage,
      deleteCollaborator: deleteCollaborator,
      introduceCollaborator: introduceCollaborator,
    }
  })
});

export default schema;
