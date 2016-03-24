'use strict';

import DAO from '../dao';

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
  subscriptionWithClientSubscriptionId,
  nodeDefinitions,
  toGlobalId,
} from 'graphql-relay';

import {
  File,
  Project,
  TestCase,
  User,
} from '../dao/model';

import * as channels from '../events/channels';

var {nodeInterface, nodeField} = nodeDefinitions(
  (globalId, context) => {
    var {type, id} = fromGlobalId(globalId);
    var user = context.rootValue.user;

    if (type === 'Project') {
      return new DAO(user).Project(id).get();
    } else if (type === 'TestCase') {
      return new DAO(user).TestCase(id).get();
    } else if (type === 'File') {
      return new DAO(user).File(id).get();
    } else if (type === 'User') {
      return new DAO(user).User(id).get();
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
        new DAO(context.rootValue.user).File(user.id).getEdgeCovered(args)
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
          new DAO(context.rootValue.user).Project(user.id).getEdgeCreated(args).then((result) => {
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
          new DAO(context.rootValue.user).Project(user.id).getEdgeCollaborations(args).then((result) => {
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
          new DAO(context.rootValue.user).TestCase(project.id).getEdgeRequired(args).then((result) => {
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
        new DAO(context.rootValue.user).File(project.id).getEdgeCovered(args)
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
          new DAO(context.rootValue.user).User(project.id).getEdgeCollaborators(args).then((result) => {
            resolve(connectionFromArraySlice(result.payload, args, result.meta));
          })
          .catch((e) => {
            reject(e);
          })
        });
      }
    },
    leaders: {
      type: userConnection,
      description: 'The leaders of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => {
        return new Promise((resolve, reject) => {
          new DAO(context.rootValue.user).User(project.id).getEdgeLeaders(args).then((result) => {
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
          new DAO(context.rootValue.user).File(testCase.id).getEdgeExemplifies(args).then((result) => {
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
          new DAO(context.rootValue.user).File(testCase.id).inEdgeFulfilled(args).then((result) => {
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
    return new DAO(context.rootValue.user).User(localId).update({name, fullName, summary});
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
    return new DAO(context.rootValue.user).User(localId).del().then(function (data) {
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
      resolve: ({projectEdge}) => { return projectEdge; }
    },
    me: {
      type: userType,
      resolve: ({me}) => { return me },
    },
  },
  mutateAndGetPayload: ({targetId, title}, context) => {
    var localId = fromGlobalId(targetId).id;
    return new DAO(context.rootValue.user).Project(localId).create({title});
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
      resolve: ({fulfillmentEdge}) => { return fulfillmentEdge; }
    },
    testCase: {
      type: testCaseType,
      resolve: ({testCase}) => {
        return testCase;
      },
    },
    project: {
      type: projectType,
      resolve: ({project}) => {
        return project;
      },
    },
  },
  mutateAndGetPayload: ({testCaseId, uri}, context) => {
    var localId = fromGlobalId(testCaseId).id;
    return new DAO(context.rootValue.user).Fulfillment(localId).create({uri});
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
    return new DAO(context.rootValue.user).Project(localId).update({title});
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
      resolve: ({deletedProjectId}) => { return deletedProjectId },
    },
    me: {
      type: userType,
      resolve: ({me}) => { return me },
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Project(localId).del();
  }
});

var introduceTestCase = mutationWithClientMutationId({
  name: 'IntroduceTestCase',
  inputFields: {
    projectId: {
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
      resolve: ({testCaseEdge}) => { return testCaseEdge; }
    },
    project: {
      type: projectType,
      resolve: ({project}) => { return project },
    },
  },
  mutateAndGetPayload: ({projectId, it}, context) => {
    var localId = fromGlobalId(projectId).id;
    return new DAO(context.rootValue.user).TestCase(localId).create({it});
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
    return new DAO(context.rootValue.user).TestCase(localId).update({it});
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
      resolve: ({deletedTestCaseId}) => {
        return toGlobalId('TestCase', deletedTestCaseId);
      },
    },
    project: {
      type: projectType,
      resolve: ({project}) => {
        return project;
      },
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).TestCase(localId).del();
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
      resolve: ({exampleEdge}) => { return exampleEdge; }
    },
    target: {
      type: nodeInterface,
      resolve: ({target}) => {return target},
    }
  },
  mutateAndGetPayload: ({targetId, uri}, context) => {
    var localId = fromGlobalId(targetId).id;
    return new DAO(context.rootValue.user).Example(localId).create({uri});
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
      resolve: ({deletedFulfillmentId}) => {
        return toGlobalId('File', deletedFulfillmentId);
      },
    },
    testCase: {
      type: testCaseType,
      resolve: ({testCase}) => {
        return testCase;
      },
    },
    project: {
      type: projectType,
      resolve: ({project}) => {
        return project;
      },
    },
  },
  mutateAndGetPayload: ({id, testCaseId}, context) => {
    var localId = fromGlobalId(id).id;
    var localTestCaseId = fromGlobalId(testCaseId).id;
    return new DAO(context.rootValue.user).Fulfillment(localId).del(localTestCaseId);
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
      resolve: ({deletedExampleId}) => {
        return toGlobalId('File', deletedExampleId);
      },
    },
    target: {
      type: nodeInterface,
      resolve: ({target}) => {
        target.id = toGlobalId('TestCase', target.id);
        return target;
      },
    }
  },
  mutateAndGetPayload: ({id, targetId}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Example(localId).del()
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
      resolve: ({coverImageEdge}) => { return coverImageEdge; }
    },
    target: {
      type: nodeInterface,
      resolve: (target) => {return target},
    }
  },
  mutateAndGetPayload: ({targetId, uri}, context) => {
    var localId = fromGlobalId(targetId).id;
    return new DAO(context.rootValue.user).Cover(localId).create({uri});
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
      resolve: ({deletedCoverImageId}) => {
        return toGlobalId('File', deletedCoverImageId);
      },
    },
    coverImageEdge: {
      type: GraphQLCoverImageEdge,
      resolve: ({coverImageEdge}) => {
        return {
          cursor: cursorForObjectInConnection([coverImageEdge], coverImageEdge),
          node: coverImageEdge,
        };
      }
    },
    target: {
      type: nodeInterface,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Cover(localId).del();
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
      resolve: ({collaboratorEdge}) => { return collaboratorEdge; }
    },
    project: {
      type: projectType,
      resolve: ({project}) => { return project; },
    }
  },
  mutateAndGetPayload: ({projectId, email}, context) => {
    var localId = fromGlobalId(projectId).id;
    return new DAO(context.rootValue.user).Collaboration(localId).create({email});
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
      resolve: ({deletedCollaboratorId}) => {
        return toGlobalId('User', deletedCollaboratorId);
      },
    },
    project: {
      type: projectType,
      resolve: ({project}) => { return project; },
    },
  },
  mutateAndGetPayload: ({id, projectId}, context) => {
    var localId = fromGlobalId(id).id;
    var localProjectId = fromGlobalId(projectId).id;
    return new DAO(context.rootValue.user).Collaboration(localId).del(localProjectId);
  }
});

var deleteCollaboration = mutationWithClientMutationId({
  name: 'DeleteCollaboration',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedCollaborationId: {
      type: GraphQLID,
      resolve: ({id}) => id,
    },
    me: {
      type: userType,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = context.rootValue.user.id;
    var localProjectId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Collaboration(localId).del(localProjectId).then(function (data) {
      return {id};
    });
  }
});

var didUpdateProject = subscriptionWithClientSubscriptionId({
  name: 'DidUpdateProject',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    project: {
      type: projectType,
      resolve: (payload) => payload
    }
  },
  mutateAndGetPayload: ({id}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      rootValue.channel = channels.didUpdateProjectChannel(localId);
      return {id};
    }
  }
});

var didIntroduceTestCase = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceTestCase',
  inputFields: {
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    testCaseEdge: {
      type: GraphQLTestCaseEdge,
      resolve: ({testCaseEdge}) => {
        testCaseEdge.node.fulfillments = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        testCaseEdge.node.examples = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};

        return testCaseEdge;
      }
    },
    project: {
      type: projectType,
      resolve: ({project}) => { return project; },
    },
  },
  mutateAndGetPayload: ({projectId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(projectId).id;
      rootValue.channel = channels.didIntroduceTestCaseChannel(localId);
      return {projectId};
    }
  }
});

var didIntroduceFulfillment = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceFulfillment',
  inputFields: {
    testCaseId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    fulfillmentEdge: {
      type: GraphQLFulfillEdge,
      resolve: ({fulfillmentEdge}) => { return fulfillmentEdge; }
    },
    testCase: {
      type: testCaseType,
      resolve: ({testCase}) => {
        return testCase;
      },
    },
    project: {
      type: projectType,
      resolve: ({project}) => {
        return project;
      },
    },
  },
  mutateAndGetPayload: ({testCaseId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(testCaseId).id;
      rootValue.channel = channels.didIntroduceFulfillmentChannel(localId);
      return {testCaseId};
    }
  }
});

var didDeleteFulfillment = subscriptionWithClientSubscriptionId({
  name: 'DidDeleteFulfillment',
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
      resolve: ({deletedFulfillmentId}) => {
        return toGlobalId('File', deletedFulfillmentId);
      },
    },
    testCase: {
      type: testCaseType,
      resolve: ({testCase}) => {
        return testCase;
      },
    },
    project: {
      type: projectType,
      resolve: ({project}) => {
        return project;
      },
    },
  },
  mutateAndGetPayload: ({id, testCaseId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      var localTestCaseId = fromGlobalId(testCaseId).id;
      rootValue.channel = channels.didDeleteFulfillmentChannel(localTestCaseId, localId);
      return {testCaseId};
    }
  }
});

var didDeleteTestCase = subscriptionWithClientSubscriptionId({
  name: 'DidDeleteTestCase',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedTestCaseId: {
      type: GraphQLID,
      resolve: ({deletedTestCaseId}) => {
        return toGlobalId('TestCase', deletedTestCaseId);
      },
    },
    project: {
      type: projectType,
      resolve: ({project}) => {
        return project;
      },
    }
  },
  mutateAndGetPayload: ({id}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      rootValue.channel = channels.didDeleteTestCaseChannel(localId);
      return {id};
    }
  }
});

var didUpdateTestCase = subscriptionWithClientSubscriptionId({
  name: 'DidUpdateTestCase',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    testCase: {
      type: testCaseType,
      resolve: (payload) => payload
    }
  },
  mutateAndGetPayload: ({id}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      rootValue.channel = channels.didUpdateTestCaseChannel(localId);
      return {id};
    }
  }
});

var didIntroduceExample = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceExample',
  inputFields: {
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    exampleEdge: {
      type: GraphQLExampleEdge,
      resolve: ({exampleEdge}) => { return exampleEdge; }
    },
    target: {
      type: nodeInterface,
      resolve: ({target}) => {return target},
    }
  },
  mutateAndGetPayload: ({targetId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(targetId).id;
      rootValue.channel = channels.didIntroduceExampleChannel(localId);
      return {targetId};
    }
  }
});

var didDeleteExample = subscriptionWithClientSubscriptionId({
  name: 'DidDeleteExample',
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
      resolve: ({deletedExampleId}) => {
        return toGlobalId('File', deletedExampleId);
      },
    },
    target: {
      type: nodeInterface,
      resolve: ({target}) => {
        target.id = toGlobalId('TestCase', target.id);
        return target;
      },
    }
  },
  mutateAndGetPayload: ({id, targetId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      rootValue.channel = channels.didDeleteExampleChannel(localId);
      return {id};
    }
  }
});

var didIntroduceCoverImage = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceCoverImage',
  inputFields: {
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    coverImageEdge: {
      type: GraphQLCoverImageEdge,
      resolve: ({coverImageEdge}) => { return coverImageEdge; }
    },
    target: {
      type: nodeInterface,
      resolve: ({target}) => { return target},
    }
  },
  mutateAndGetPayload: ({targetId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(targetId).id;
      rootValue.channel = channels.didIntroduceCoverImageChannel(localId);
      return {targetId};
    }
  }
});

var didDeleteCoverImage = subscriptionWithClientSubscriptionId({
  name: 'DidDeleteCoverImage',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedCoverImageId: {
      type: GraphQLID,
      resolve: ({deletedCoverImageId}) => {
        return toGlobalId('File', deletedCoverImageId);
      },
    },
    coverImageEdge: {
      type: GraphQLCoverImageEdge,
      resolve: ({coverImageEdge}) => {
        return {
          cursor: cursorForObjectInConnection([coverImageEdge], coverImageEdge),
          node: coverImageEdge,
        };
      }
    },
    target: {
      type: nodeInterface,
      resolve: ({target}) => { return target; },
    }
  },
  mutateAndGetPayload: ({id, targetId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      rootValue.channel = channels.didDeleteCoverImageChannel(localId);
      return {id};
    }
  }
});

var didIntroduceCollaborator = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceCollaborator',
  inputFields: {
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    collaboratorEdge: {
      type: GraphQLUserEdge,
      resolve: ({collaboratorEdge}) => { return collaboratorEdge; }
    },
    project: {
      type: projectType,
      resolve: ({project}) => { return project; },
    }
  },
  mutateAndGetPayload: ({projectId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(projectId).id;
      rootValue.channel = channels.didIntroduceCollaboratorChannel(localId);
      return {projectId};
    }
  }
});

var didDeleteCollaborator = subscriptionWithClientSubscriptionId({
  name: 'DidDeleteCollaborator',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    deletedCollaboratorId: {
      type: GraphQLID,
      resolve: ({deletedCollaboratorId}) => {
        return toGlobalId('User', deletedCollaboratorId);
      },
    },
    project: {
      type: projectType,
      resolve: ({project}) => { return project; },
    },
  },
  mutateAndGetPayload: ({id, projectId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      var localProjectId = fromGlobalId(projectId).id;
      rootValue.channel = channels.didDeleteCollaboratorChannel(localProjectId, localId);
      return {id};
    }
  }
});

var didIntroduceCollaboration = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceCollaboration',
  inputFields: {
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    collaborationEdge: {
      type: GraphQLProjectEdge,
      resolve: ({collaborationEdge}) => {
        collaborationEdge.testCases = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        return {
          cursor: cursorForObjectInConnection([collaborationEdge], collaborationEdge),
          node: collaborationEdge,
        };
      }
    },
    me: {
      type: userType,
      resolve: (payload) => {
        return payload.me;
      },
    }
  },
  mutateAndGetPayload: ({meId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(meId).id;
      rootValue.channel = channels.didIntroduceCollaborationChannel(localId);
      return {meId};
    }
  }
});

var didDeleteCollaboration = subscriptionWithClientSubscriptionId({
  name: 'DidDeleteCollaboration',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedCollaborationId: {
      type: GraphQLID,
      resolve: ({deletedCollaborationId}) => {
        return toGlobalId('Project', deletedCollaborationId);
      },
    },
    me: {
      type: userType,
      resolve: ({me}) => { return me; },
    },
  },
  mutateAndGetPayload: ({id, meId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      var localMeId = fromGlobalId(meId).id;
      rootValue.channel = channels.didDeleteCollaborationChannel(localMeId, localId);
      return {id};
    }
  }
});

var didDeleteProject = subscriptionWithClientSubscriptionId({
  name: 'DidDeleteProject',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedProjectId: {
      type: GraphQLID,
      resolve: ({deletedProjectId}) => { return toGlobalId('Project', deletedProjectId); },
    },
    me: {
      type: userType,
      resolve: () => { return {id: null}; },
    },
  },
  mutateAndGetPayload: ({id, meId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(id).id;
      var localMeId = fromGlobalId(meId).id;
      rootValue.channel = channels.didDeleteProjectChannel(localId);
      return {id};
    }
  }
});

var didIntroduceProject = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceProject',
  inputFields: {
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    projectEdge: {
      type: GraphQLProjectEdge,
      resolve: ({projectEdge}) => {
        projectEdge.testCases = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        return {
          cursor: cursorForObjectInConnection([projectEdge], projectEdge),
          node: projectEdge,
        };
      }
    },
    me: {
      type: userType,
      resolve: (payload) => {
        return payload.me;
      },
    }
  },
  mutateAndGetPayload: ({meId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(meId).id;
      rootValue.channel = channels.didIntroduceProjectChannel(localId);
      return {meId};
    }
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
          return new DAO(root.user).Me().get();
        }
      },
      node: nodeField
    }
  }),

  // mutation
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      deleteCollaboration,
      deleteCollaborator,
      deleteCoverImage,
      deleteExample,
      deleteFulfillment,
      deleteProject,
      deleteTestCase,
      deleteUser,
      introduceCollaborator,
      introduceCoverImage,
      introduceExample,
      introduceFulfillment,
      introduceProject,
      introduceTestCase,
      updateProject,
      updateTestCase,
      updateUser,
    }
  }),

  // subscription
  subscription: new GraphQLObjectType({
    name: 'Subscription',
    fields: {
      didDeleteCollaboration,
      didDeleteCollaborator,
      didDeleteCoverImage,
      didDeleteExample,
      didDeleteFulfillment,
      didDeleteProject,
      didDeleteTestCase,
      didIntroduceCollaborator,
      didIntroduceCollaboration,
      didIntroduceCoverImage,
      didIntroduceExample,
      didIntroduceFulfillment,
      didIntroduceProject,
      didIntroduceTestCase,
      didUpdateProject,
      didUpdateTestCase,
    }
  })
});

export default schema;
