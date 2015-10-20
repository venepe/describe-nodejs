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
  connectionFromArray,
  connectionFromPromisedArray,
  cursorForObjectInConnection,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
  toGlobalId,
} from 'graphql-relay';

import {
  Image,
  Paper,
  Project,
  TestCase,
  User,
} from '../dao/model'

let authticatedUserType = new GraphQLObjectType({
  name: 'Authicated user',
  description: 'Authicated user object',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The id of the authenticated user.',
    },
    role: {
      type: GraphQLString,
      description: 'The role of the authenticated user.',
    },
    username: {
      type: GraphQLString,
      description: 'The username of the authenticated user.',
    },
    expires: {
      type: GraphQLFloat,
      description: 'When the authenticated user expires.',
    },
    token: {
      type: GraphQLString,
      description: 'The token of the an authenticated user.',
    }
  })
});

var {nodeInterface, nodeField} = nodeDefinitions(
  (globalId, context) => {
    var {type, id} = fromGlobalId(globalId);
    var user = context.rootValue.user;

    if (type === 'Project') {
      return dao(user).Project(id).get();
    } else if (type === 'TestCase') {
      return dao(user).TestCase(id).get();
    } else if (type === 'Image') {
      return dao(user).Image(id).get();
    } else if (type === 'Paper') {
      return dao(user).Paper(id).get();
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
    } else if (obj instanceof Image) {
      return imageType;
    } else if (obj instanceof Paper) {
      return paperType;
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
    username: {
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
        dao(context.rootValue.user).Image(user.id).getEdgeCovered(args)
        ,
        args
      ),
    },
    projects: {
      type: projectConnection,
      description: 'The projects created by the user.',
      args: connectionArgs,
      resolve: (user, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).Project(user.id).getEdgeCreated(args)
        ,
        args
      ),
    },
    testCases: {
      type: testCaseConnection,
      description: 'The test cases created by the user.',
      args: connectionArgs,
      resolve: (user, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).TestCase(user.id).getEdgeCreated(args)
        ,
        args
      ),
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
      resolve: (project, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).TestCase(project.id).getEdgeRequired(args)
        ,
        args
      ),
    },
    coverImages: {
      type: coverImageConnection,
      description: 'The cover images of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).Image(project.id).getEdgeCovered(args)
        ,
        args
      ),
    },
    images: {
      type: imageConnection,
      description: 'The images of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).Image(project.id).getEdgeDescribes(args)
        ,
        args
      ),
    },
    papers: {
      type: paperConnection,
      description: 'The papers of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).Paper(project.id).getEdgeDescribes(args)
        ,
        args
      ),
    }
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
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the test case was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the test case was last updated.',
    },
    images: {
      type: imageConnection,
      description: 'The images describing the test case.',
      args: connectionArgs,
      resolve: (testCase, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).Image(testCase.id).getEdgeDescribes(args)
        ,
        args
      ),
    },
    papers: {
      type: paperConnection,
      description: 'The papers describing the test case.',
      args: connectionArgs,
      resolve: (testCase, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).Paper(testCase.id).getEdgeDescribes(args)
        ,
        args
      ),
    },
    fulfillments: {
      type: fulfillConnection,
      description: 'The projects fulfilling the test case.',
      args: connectionArgs,
      resolve: (testCase, args, context) => connectionFromPromisedArray(
        dao(context.rootValue.user).Project(testCase.id).inEdgeFulfilled(args)
        ,
        args
      ),
    }
  }),
  interfaces: [nodeInterface],
});


let imageType = new GraphQLObjectType({
  name: 'Image',
  description: 'Image object',
  fields: () => ({
    id: globalIdField('Image'),
    uri: {
      type: GraphQLString,
      description: 'The uri of the image.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the image was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the image was last updated.',
    }
  }),
  interfaces: [nodeInterface],
});

let paperType = new GraphQLObjectType({
  name: 'Paper',
  description: 'Paper object',
  fields: () => ({
    id: globalIdField('Paper'),
    text: {
      type: GraphQLString,
      description: 'The writen text of the paper.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the paper was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the paper was last updated.',
    }
  }),
  interfaces: [nodeInterface],
});

var {connectionType: testCaseConnection, edgeType: GraphQLTestCaseEdge} =
  connectionDefinitions({name: 'TestCase', nodeType: testCaseType});

var {connectionType: projectConnection, edgeType: GraphQLProjectEdge} =
  connectionDefinitions({name: 'Project', nodeType: projectType});

var {connectionType: imageConnection, edgeType: GraphQLImageEdge} =
  connectionDefinitions({name: 'Image', nodeType: imageType});

var {connectionType: coverImageConnection, edgeType: GraphQLCoverImageEdge} =
  connectionDefinitions({name: 'CoverImage', nodeType: imageType});

var {connectionType: paperConnection, edgeType: GraphQLPaperEdge} =
  connectionDefinitions({name: 'Paper', nodeType: paperType});

var {connectionType: fulfillConnection, edgeType: GraphQLFulfillEdge} =
  connectionDefinitions({name: 'Fulfills', nodeType: projectType});

// var {connectionType: searchProjectsConnection} =
//   connectionDefinitions({name: 'SearchProjects', nodeType: projectType});

var introduceUser = mutationWithClientMutationId({
  name: 'IntroduceUser',
  inputFields: {
    username: {
      type: new GraphQLNonNull(GraphQLString),
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
      type: new GraphQLNonNull(GraphQLString),
      description: 'The email of the user.',
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The password of the user.',
    }
  },
  outputFields: {
    user: {
      type: userType,
      resolve: (payload) => payload
    },
    authenticate: {
      type: authticatedUserType,
      resolve: (payload) => payload.authenticate
    }
  },
  mutateAndGetPayload: ({username, fullName, summary, email, password}, context) => {
    return dao().User().create({username, fullName, summary, email, password});
  }
});

var updateUser = mutationWithClientMutationId({
  name: 'UpdateUser',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    username: {
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
    password: {
      type: GraphQLString,
      description: 'The password of the user.',
    }
  },
  outputFields: {
    user: {
      type: userType,
      resolve: (payload) => payload
    }
  },
  mutateAndGetPayload: ({id, username, fullName, summary, email, password}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).User(localId).update({username, fullName, summary, email, password});
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

var authenticateUser = mutationWithClientMutationId({
  name: 'AuthenticateUser',
  inputFields: {
    username: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The username of a user.',
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The password of a user.',
    }
  },
  outputFields: {
    authenticate: {
      type: authticatedUserType,
      resolve: (payload) => payload
    }
  },
  mutateAndGetPayload: ({username, password}, context) => {
    return dao().UserAuthenticate().authenticate({username, password});
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

var fulfillProject = mutationWithClientMutationId({
  name: 'FulfillProject',
  inputFields: {
    testCaseId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The title of the project.',
    }
  },
  outputFields: {
    fulfillmentEdge: {
      type: GraphQLProjectEdge,
      resolve: (payload) => {
        var project = payload.project;
        return {
          cursor: cursorForObjectInConnection([project], project),
          node: project,
        };
      }
    },
    testCase: {
      type: testCaseType,
      resolve: () => {},
    },
    me: {
      type: userType,
      resolve: (payload) => {
        return {
          id: payload.user.id
        }
      },
    },
  },
  mutateAndGetPayload: ({testCaseId, title}, context) => {
    var localId = fromGlobalId(testCaseId).id;
    var user = context.rootValue.user
    return new Promise((resolve, reject) => {
      dao(user)
        .Project(localId)
        .createFulfills({title})
        .then(function(project) {
          resolve({
            project,
            user
          });
        })
        .catch(function(e) {
          reject();
        });
    });
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
        return {
          cursor: cursorForObjectInConnection([payload], payload),
          node: payload,
        };
      }
    },
    project: {
      type: projectType,
      resolve: () => {},
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
      resolve: ({id}) => id,
    },
    project: {
      type: projectType,
      resolve: () => {},
    }
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).TestCase(localId).del().then(function (data) {
      return {id};
    });
  }
});

var introducePaper = mutationWithClientMutationId({
  name: 'IntroducePaper',
  inputFields: {
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    text: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The writen text of the paper.',
    }
  },
  outputFields: {
    paperEdge: {
      type: GraphQLPaperEdge,
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
  mutateAndGetPayload: ({targetId, text}, context) => {
    var localId = fromGlobalId(targetId).id;
    return dao(context.rootValue.user).Paper(localId).create({text});
  }
});

var updatePaper = mutationWithClientMutationId({
  name: 'UpdatePaper',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    text: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The writen text of the paper.',
    }
  },
  outputFields: {
    paper: {
      type: paperType,
      resolve: (payload) => payload
    }
  },
  mutateAndGetPayload: ({id, text}, context) => {
    var localId = fromGlobalId(id).id;
    return dao(context.rootValue.user).Paper(localId).update({text});
  }
});

var deletePaper = mutationWithClientMutationId({
  name: 'DeletePaper',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedPaperId: {
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
    return dao(context.rootValue.user).Paper(localId).del().then(function (data) {
      return {id};
    });
  }
});

var introduceImage = mutationWithClientMutationId({
  name: 'IntroduceImage',
  inputFields: {
    targetId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The uri of the image.',
    }
  },
  outputFields: {
    imageEdge: {
      type: GraphQLImageEdge,
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
    return dao(context.rootValue.user).Image(localId).create({uri});
  }
});

var deleteImage = mutationWithClientMutationId({
  name: 'DeleteImage',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedImageId: {
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
    return dao(context.rootValue.user).Image(localId).del().then(function (data) {
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
      description: 'The uri of the image.',
    }
  },
  outputFields: {
    imageEdge: {
      type: GraphQLImageEdge,
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
    return dao(context.rootValue.user).Image(localId).createCover({uri});
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
    return dao(context.rootValue.user).Image(localId).del().then(function (data) {
      return {id};
    });
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
      searchProjects: {
        type: projectConnection,
        description: 'The projects from a query.',
        args: {
          query: {
            type: new GraphQLNonNull(GraphQLString)
          },
          before: {
            type: GraphQLString
          },
          after: {
            type: GraphQLString
          },
          first: {
            type: GraphQLInt
          },
          last: {
            type: GraphQLInt
          }
        },
        resolve: (root, {query, before, after, first, last}) => connectionFromPromisedArray(
          dao(root.user).Search(query).findProject({before, after, first, last})
          ,
          {before, after, first, last}
        ),
      },
      node: nodeField
    }
  }),

  // mutation
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: {
      authenticateUser: authenticateUser,
      introduceUser: introduceUser,
      updateUser: updateUser,
      deleteUser: deleteUser,
      introduceProject: introduceProject,
      fulfillProject: fulfillProject,
      updateProject: updateProject,
      deleteProject: deleteProject,
      introduceTestCase: introduceTestCase,
      updateTestCase: updateTestCase,
      deleteTestCase: deleteTestCase,
      introducePaper: introducePaper,
      updatePaper: updatePaper,
      deletePaper: deletePaper,
      introduceImage: introduceImage,
      deleteImage: deleteImage,
      deleteCoverImage: deleteCoverImage,
      introduceCoverImage: introduceCoverImage,
    }
  })
});

export default schema;
