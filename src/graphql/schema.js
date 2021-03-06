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
  GraphQLInterfaceType,
  GraphQLEnumType,
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
  Collaborator,
  Cover,
  Fulfillment,
  FulfillmentEvent,
  Message,
  Invitation,
  Project,
  ProjectEvent,
  TestCase,
  TestCaseEvent,
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
    } else if (type === 'Fulfillment') {
      return new DAO(user).Fulfillment(id).get();
    } else if (type === 'User') {
      return new DAO(user).User(id).get();
    } else if (type === 'Collaborator') {
      return new DAO(user).Collaboration(id).get();
    } else if (type === 'Message') {
      return new DAO(user).Message(id).get();
    } else if (type === 'TestCaseEvent') {
      return new DAO(user).TestCaseEvent(id).get();
    } else if (type === 'ProjectEvent') {
      return new DAO(user).ProjectEvent(id).get();
    } else if (type === 'FulfillmentEvent') {
      return new DAO(user).FulfillmentEvent(id).get();
    } else if (type === 'Invitation') {
      return new DAO(user).Invitation(id).get();
    } else {
      return null;
    }
  },
  (obj) => {

    if (obj instanceof Project) {
      return projectType;
    } else if (obj instanceof TestCase) {
      return testCaseType;
    } else if (obj instanceof Cover) {
      return coverType;
    } else if (obj instanceof Fulfillment) {
      return fulfillmentType;
    } else if (obj instanceof User) {
      return userType;
    } else if (obj instanceof Collaborator) {
      return collaboratorType;
    } else if (obj instanceof Message) {
      return messageType;
    } else if (obj instanceof TestCaseEvent) {
      return testCaseEventType;
    } else if (obj instanceof ProjectEvent) {
      return projectEventType;
    } else if (obj instanceof FulfillmentEvent) {
      return fulfillmentEventType;
    } else if (obj instanceof Invitation) {
      return invitationType;
    } else {
      return null;
    }
  }
);

let channelInterface = new GraphQLInterfaceType({
  name: 'Channel',
  description: 'A channel to communicate over.',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The id of the channel.',
    },
    messages: {
      type: messageConnection,
      description: 'The messages of the channel.',
      args: connectionArgs,
    },
    numOfMessagesUnread: {
      type: GraphQLInt,
      description: 'The total number of messages unread on the channel.',
    },
  }),
  resolveType: channel => {
    var {type, id} = fromGlobalId(channel.id);
    channel.id = id;
    if (type === 'Project') {
      return projectType;
    } else if (type === 'TestCase') {
      return testCaseType;
    } else if (type === 'Fulfillment') {
      return fulfillmentType;
    } else {
      return null;
    }
  }
});

let fileInterface = new GraphQLInterfaceType({
  name: 'File',
  description: 'An object point to an uri.',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The id of the file.',
    },
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
  resolveType: file => {
    var {type, id} = fromGlobalId(file.id);
    if (type === 'Fulfillment') {
      return fulfillmentType;
    } else if (type === 'Cover') {
      return coverType;
    } else {
      return null;
    }
  }
});

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
    cover: {
      type: coverType,
      description: 'The cover image of the user.',
      resolve: (user, args, context) => {
        return new DAO(context.rootValue.user).File(user.id).getCover();
      }
    },
    projects: {
      type: projectConnection,
      description: 'The projects for the user.',
      args: connectionArgs,
      resolve: (user, args, context) => {
        return new DAO(context.rootValue.user).Project(user.id).getEdgeCollaborations(args);
      }
    },
    invitations: {
      type: invitationConnection,
      description: 'The invites the user recieved.',
      args: connectionArgs,
      resolve: (user, args, context) => {
        return new DAO(context.rootValue.user).Invitation(user.id).getEdgeInvitations(args);
      }
    },
    contacts: {
      type: contactConnection,
      description: 'The contacts for the user.',
      args: connectionArgs,
      resolve: (user, args, context) => {
        return new DAO(context.rootValue.user).User(user.id).getEdgeKnows(args);
      }
    }
  }),
  interfaces: [nodeInterface],
});


var collaboratorRoles = new GraphQLEnumType({
  name: 'CollaboratorRoles',
  values: {
    AUTHOR: { value: 0 },
    CONTRIBUTOR: { value: 1 }
  }
});

let collaboratorType = new GraphQLObjectType({
  name: 'Collaborator',
  description: 'Collaborator object',
  fields: () => ({
    id: globalIdField('Collaborator'),
    profile: {
      type: userType,
      description: 'Who the collaborator is.',
    },
    role: {
      type: collaboratorRoles,
      description: 'The role of the collaborator.',
    },
    permission: {
      type: GraphQLInt,
      description: 'The user permission on the collaborator.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the collaborator was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the collaborator was last updated.',
    },
  }),
  interfaces: [nodeInterface],
});

let inviteeType = new GraphQLObjectType({
  name: 'Invitee',
  description: 'Invitee object',
  fields: () => ({
    id: globalIdField('Invitee'),
    profile: {
      type: userType,
      description: 'Who the invitee is.',
    },
    role: {
      type: collaboratorRoles,
      description: 'The proposed role of the invitee.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the collaborator was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the collaborator was last updated.',
    },
  }),
  interfaces: [nodeInterface],
});

let projectType = new GraphQLObjectType({
  name: 'Project',
  description: 'Project object',
  fields: () => ({
    id: globalIdField('Project'),
    text: {
      type: GraphQLString,
      description: 'The text of the project.',
    },
    numOfTestCases: {
      type: GraphQLInt,
      description: 'The total number of test cases for the project.',
    },
    numOfTestCasesFulfilled: {
      type: GraphQLInt,
      description: 'The total number of test cases fulfilled for the project.',
    },
    permission: {
      type: GraphQLInt,
      description: 'The user permission on the project.',
    },
    numOfMessagesUnread: {
      type: GraphQLInt,
      description: 'The total number of messages unread on the project.',
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
        return new DAO(context.rootValue.user).TestCase(project.id).getEdgeRequired(args);
      }
    },
    collaborators: {
      type: collaboratorConnection,
      description: 'The collaborators of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => {
        return new DAO(context.rootValue.user).User(project.id).getEdgeCollaborators(args);
      }
    },
    invitees: {
      type: inviteeConnection,
      description: 'The invitees of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => {
        return new DAO(context.rootValue.user).User(project.id).getEdgeInvitees(args);
      }
    },
    messages: {
      type: messageConnection,
      description: 'The messages of the project.',
      args: connectionArgs,
      resolve: (project, args, context) => {
        return new DAO(context.rootValue.user).Message(project.id).getEdgeMessages(args);
      }
    },
    events: {
      type: projectEventConnection,
      description: 'The changes made on the project.',
      args: connectionArgs,
      resolve: (project, args, context) => {
        return new DAO(context.rootValue.user).ProjectEvent(project.id).getProjectEvents(args);
      }
    }
  }),
  interfaces: [nodeInterface, channelInterface],
});

let projectEventType = new GraphQLObjectType({
  name: 'ProjectEvent',
  description: 'Project event object',
  fields: () => ({
    id: globalIdField('ProjectEvent'),
    text: {
      type: GraphQLString,
      description: 'The text of the project event.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the project was created.',
    },
    author: {
      type: userType,
      description: 'The user who created the text event',
    }
  }),
  interfaces: [nodeInterface],
});

let testCaseType = new GraphQLObjectType({
  name: 'TestCase',
  description: 'Test case object',
  fields: () => ({
    id: globalIdField('TestCase'),
    text: {
      type: GraphQLString,
      description: 'The \"it\" or what a test case should do.',
    },
    status: {
      type: fulfillmentStatus,
      description: 'The status of the fulfillment.',
    },
    numOfMessagesUnread: {
      type: GraphQLInt,
      description: 'The total number of messages unread on the test case.',
    },
    permission: {
      type: GraphQLInt,
      description: 'The user permission on the test case.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the test case was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the test case was last updated.',
    },
    fulfillments: {
      type: fulfillConnection,
      description: 'The possible files fulfilling the test case.',
      args: connectionArgs,
      resolve: (testCase, args, context) => {
        return new DAO(context.rootValue.user).File(testCase.id).getEdgeFulfilled(args);
      }
    },
    messages: {
      type: messageConnection,
      description: 'The messages of the test case.',
      args: connectionArgs,
      resolve: (testCase, args, context) => {
        return new DAO(context.rootValue.user).Message(testCase.id).getEdgeMessages(args);
      }
    },
    events: {
      type: testCaseEventConnection,
      description: 'The changes made on the test case.',
      args: connectionArgs,
      resolve: (testCase, args, context) => {
        return new DAO(context.rootValue.user).TestCaseEvent(testCase.id).getTestCaseEvents(args);
      }
    }
  }),
  interfaces: [nodeInterface, channelInterface],
});

let testCaseEventType = new GraphQLObjectType({
  name: 'TestCaseEvent',
  description: 'Test case event object',
  fields: () => ({
    id: globalIdField('TestCaseEvent'),
    text: {
      type: GraphQLString,
      description: 'The \"it\" or what a test case should do.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the test case was created.',
    },
    author: {
      type: userType,
      description: 'The user who created the text event',
    }
  }),
  interfaces: [nodeInterface],
});

let coverType = new GraphQLObjectType({
  name: 'Cover',
  description: 'Cover object',
  fields: () => ({
    id: globalIdField('Cover'),
    uri: {
      type: GraphQLString,
      description: 'The uri of the cover.',
    },
    permission: {
      type: GraphQLInt,
      description: 'The user permission on the cover.',
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
  interfaces: [nodeInterface, fileInterface],
});

var fulfillmentStatus = new GraphQLEnumType({
  name: 'FulfillmentStatus',
  values: {
    INCOMPLETE: { value: -1 },
    SUBMITTED: { value: 0 },
    REJECTED: { value: 1 },
    ACCEPTED: { value: 2 }
  }
});

let fulfillmentType = new GraphQLObjectType({
  name: 'Fulfillment',
  description: 'Fulfillment object',
  fields: () => ({
    id: globalIdField('Fulfillment'),
    uri: {
      type: GraphQLString,
      description: 'The uri of the fulfillment.',
    },
    status: {
      type: fulfillmentStatus,
      description: 'The status of the fulfillment.',
    },
    numOfMessagesUnread: {
      type: GraphQLInt,
      description: 'The total number of messages unread on the fulfillment.',
    },
    permission: {
      type: GraphQLInt,
      description: 'The user permission on the fulfillment.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the fulfillment was created.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the fulfillment was last updated.',
    },
    messages: {
      type: messageConnection,
      description: 'The messages on the fulfillment.',
      args: connectionArgs,
      resolve: (fulfillment, args, context) => {
        return new DAO(context.rootValue.user).Message(fulfillment.id).getEdgeMessages(args);
      }
    },
    events: {
      type: fulfillEventConnection,
      description: 'The changes made on the fulfillment.',
      args: connectionArgs,
      resolve: (fulfillment, args, context) => {
        return new DAO(context.rootValue.user).FulfillmentEvent(fulfillment.id).getFulfillmentEvents(args);
      }
    }
  }),
  interfaces: [nodeInterface, channelInterface, fileInterface],
});

let fulfillmentEventType = new GraphQLObjectType({
  name: 'FulfillmentEvent',
  description: 'Fulfillment event object',
  fields: () => ({
    id: globalIdField('FulfillmentEvent'),
    uri: {
      type: GraphQLString,
      description: 'The uri of the fulfillment.',
    },
    status: {
      type: fulfillmentStatus,
      description: 'The status of the fulfillment.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the fulfillment was created.',
    },
    author: {
      type: userType,
      description: 'The user who created the event',
    }
  }),
  interfaces: [nodeInterface],
});

let invitationType = new GraphQLObjectType({
  name: 'Invitation',
  description: 'Invitation object',
  fields: () => ({
    id: globalIdField('Invitation'),
    project: {
      type: projectType,
      description: 'The project the user is invited to.',
    },
    role: {
      type: collaboratorRoles,
      description: 'The role the user is invited to perform.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the invitation was updated.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the invitation was created.',
    },
    sponsor: {
      type: userType,
      description: 'The collaborator who invited the user',
    }
  }),
  interfaces: [nodeInterface],
});

let messageType = new GraphQLObjectType({
  name: 'Message',
  description: 'Message object',
  fields: () => ({
    id: globalIdField('Message'),
    text: {
      type: GraphQLString,
      description: 'The text of the message.',
    },
    updatedAt: {
      type: GraphQLString,
      description: 'The timestamp when the message was updated.',
    },
    createdAt: {
      type: GraphQLString,
      description: 'The timestamp when the message was created.',
    },
    author: {
      type: userType,
      description: 'The user who created the message.',
    }
  }),
  interfaces: [nodeInterface],
});

var {connectionType: testCaseConnection, edgeType: GraphQLTestCaseEdge} =
  connectionDefinitions({name: 'TestCase', nodeType: testCaseType});

var {connectionType: testCaseEventConnection, edgeType: GraphQLTestCaseEventEdge} =
  connectionDefinitions({name: 'TestCaseEvent', nodeType: testCaseEventType});

var {connectionType: projectEventConnection, edgeType: GraphQLProjectEventEdge} =
  connectionDefinitions({name: 'ProjectEvent', nodeType: projectEventType});

var {connectionType: projectConnection, edgeType: GraphQLProjectEdge} =
  connectionDefinitions({name: 'Project', nodeType: projectType});

var {connectionType: invitationConnection, edgeType: GraphQLInvitationEdge} =
  connectionDefinitions({name: 'Invitation', nodeType: invitationType});

var {connectionType: messageConnection, edgeType: GraphQLMessageEdge} =
  connectionDefinitions({name: 'Message', nodeType: messageType});

var {connectionType: coverImageConnection, edgeType: GraphQLCoverImageEdge} =
  connectionDefinitions({name: 'CoverImages', nodeType: coverType});

var {connectionType: fulfillConnection, edgeType: GraphQLFulfillEdge} =
  connectionDefinitions({name: 'Fulfills', nodeType: fulfillmentType});

var {connectionType: fulfillEventConnection, edgeType: GraphQLFulfillEventEdge} =
  connectionDefinitions({name: 'FulfillsEvent', nodeType: fulfillmentEventType});

var {connectionType: collaboratorConnection, edgeType: GraphQLCollaboratorEdge} =
  connectionDefinitions({name: 'Collaborator', nodeType: collaboratorType});

var {connectionType: inviteeConnection, edgeType: GraphQLInviteeEdge} =
  connectionDefinitions({name: 'Invitee', nodeType: inviteeType});

var {connectionType: contactConnection, edgeType: GraphQLContactEdge} =
  connectionDefinitions({name: 'Contact', nodeType: userType});

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
    return new DAO(context.rootValue.user).User(localId).del().then((data) => {
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
    text: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The text of the project.',
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
  mutateAndGetPayload: ({targetId, text}, context) => {
    var localId = fromGlobalId(targetId).id;
    return new DAO(context.rootValue.user).Project(localId).create({text});
  }
});

var introduceFulfillment = mutationWithClientMutationId({
  name: 'IntroduceFulfillment',
  inputFields: {
    testCaseId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    status: {
      type: new GraphQLNonNull(fulfillmentStatus),
      description: 'The status of the fulfillment.',
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
  mutateAndGetPayload: ({testCaseId, status, uri}, context) => {
    var localId = fromGlobalId(testCaseId).id;
    return new DAO(context.rootValue.user).Fulfillment(localId).create({status, uri});
  }
});

var updateProject = mutationWithClientMutationId({
  name: 'UpdateProject',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    text: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The text of the project.',
    }
  },
  outputFields: {
    project: {
      type: projectType,
      resolve: ({project}) => { return project; }
    },
    projectEventEdge: {
      type: GraphQLProjectEventEdge,
      resolve: ({projectEventEdge}) => { return projectEventEdge }
    },
  },
  mutateAndGetPayload: ({id, text}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Project(localId).update({text});
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
    text: {
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
  mutateAndGetPayload: ({projectId, text}, context) => {
    var localId = fromGlobalId(projectId).id;
    return new DAO(context.rootValue.user).TestCase(localId).create({text});
  }
});

var updateTestCase = mutationWithClientMutationId({
  name: 'UpdateTestCase',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    text: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'What it should do.',
    }
  },
  outputFields: {
    testCase: {
      type: testCaseType,
      resolve: ({testCase}) => { return testCase; }
    },
    testCaseEventEdge: {
      type: GraphQLTestCaseEventEdge,
      resolve: ({testCaseEventEdge}) => { return testCaseEventEdge }
    },
  },
  mutateAndGetPayload: ({id, text}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).TestCase(localId).update({text});
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

var updateFulfillment = mutationWithClientMutationId({
  name: 'UpdateFulfillment',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    testCaseId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    status: {
      type: fulfillmentStatus,
      description: 'The status of the update.',
    },
    uri: {
      type: GraphQLString,
      description: 'The uri of the fulfillment.',
    }
  },
  outputFields: {
    fulfillment: {
      type: fulfillmentType,
      resolve: ({fulfillment}) => { return fulfillment; }
    },
    fulfillmentEventEdge: {
      type: GraphQLFulfillEventEdge,
      resolve: ({fulfillmentEventEdge}) => { return fulfillmentEventEdge }
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
  mutateAndGetPayload: ({id, testCaseId, status, uri}, context) => {
    var localId = fromGlobalId(id).id;
    var localTestCaseId = fromGlobalId(testCaseId).id;
    return new DAO(context.rootValue.user).Fulfillment(localId).update(localTestCaseId, {status, uri});
  }
});

var introduceUserCover = mutationWithClientMutationId({
  name: 'IntroduceUserCover',
  inputFields: {
    userId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    uri: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The uri of the file.',
    }
  },
  outputFields: {
    user: {
      type: userType,
      resolve: ({user}) => { return user; }
    }
  },
  mutateAndGetPayload: ({userId, uri}, context) => {
    var localId = fromGlobalId(userId).id;
    return new DAO(context.rootValue.user).Cover(localId).createUserCover({uri});
  }
});

var deleteUserCover = mutationWithClientMutationId({
  name: 'DeleteUserCover',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    user: {
      type: userType,
      resolve: ({user}) => { return user; }
    },
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Cover(localId).delUserCover();
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
        return toGlobalId('Collaborator', deletedCollaboratorId);
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

var leaveProject = mutationWithClientMutationId({
  name: 'LeaveProject',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    leftProjectId: {
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
    return new DAO(context.rootValue.user).Project(localId).leave().then((data) => {
      return {id};
    });
  }
});

var introduceInvitee = mutationWithClientMutationId({
  name: 'IntroduceInvitee',
  inputFields: {
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The email of the invitee.',
    }
  },
  outputFields: {
    inviteeEdge: {
      type: GraphQLInviteeEdge,
      resolve: ({inviteeEdge}) => { return inviteeEdge; }
    },
    project: {
      type: projectType,
      resolve: ({project}) => { return project; },
    }
  },
  mutateAndGetPayload: ({projectId, email}, context) => {
    var localId = fromGlobalId(projectId).id;
    return new DAO(context.rootValue.user).Invitation(localId).create({email});
  }
});

var acceptInvitation = mutationWithClientMutationId({
  name: 'AcceptInvitation',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    projectEdge: {
      type: GraphQLProjectEdge,
      resolve: ({projectEdge}) => { return projectEdge; }
    },
    acceptedInvitationId: {
      type: GraphQLID,
      resolve: ({acceptedInvitationId}) => {
        return toGlobalId('Invitation', acceptedInvitationId);
      },
    },
    me: {
      type: userType,
      resolve: ({me}) => { return me },
    },
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Invitation(localId).accept();
  }
});

var declineInvitation = mutationWithClientMutationId({
  name: 'DeclineInvitation',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    invitationEdge: {
      type: GraphQLInvitationEdge,
      resolve: ({invitationEdge}) => { return invitationEdge; }
    },
    declinedInvitationId: {
      type: GraphQLID,
      resolve: ({declinedInvitationId}) => {
        return toGlobalId('Invitation', declinedInvitationId);
      },
    },
    me: {
      type: userType,
      resolve: ({me}) => { return me },
    },
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Invitation(localId).decline();
  }
});

var deleteInvitee = mutationWithClientMutationId({
  name: 'DeleteInvitee',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedInviteeId: {
      type: GraphQLID,
      resolve: ({deletedInviteeId}) => {
        return toGlobalId('Invitee', deletedInviteeId);
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
    return new DAO(context.rootValue.user).Invitation(localId).del(localProjectId);
  }
});

var introduceMessage = mutationWithClientMutationId({
  name: 'IntroduceMessage',
  inputFields: {
    channelId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    text: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The text of the message.',
    }
  },
  outputFields: {
    messageEdge: {
      type: GraphQLMessageEdge,
      resolve: ({messageEdge}) => { return messageEdge; }
    },
    channel: {
      type: channelInterface,
      resolve: ({channel}) => { return channel },
    },
  },
  mutateAndGetPayload: ({channelId, text}, context) => {
    var {type, id} = fromGlobalId(channelId);
    var payload = {text};
    return new DAO(context.rootValue.user).Message(id).create({payload, channelType: type});
  }
});

var readChannel = mutationWithClientMutationId({
  name: 'ReadChannel',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    channel: {
      type: channelInterface,
      resolve: ({channel}) => { return channel },
    },
  },
  mutateAndGetPayload: ({id}, context) => {
    var {type, id} = fromGlobalId(id);
    return new DAO(context.rootValue.user).Message(id).readChannel({channelType: type});
  }
});

var introduceContact = mutationWithClientMutationId({
  name: 'IntroduceContact',
  inputFields: {
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The email of the contact.',
    }
  },
  outputFields: {
    contactEdge: {
      type: GraphQLContactEdge,
      resolve: ({contactEdge}) => { return contactEdge; }
    },
    me: {
      type: userType,
      resolve: ({me}) => { return me; },
    }
  },
  mutateAndGetPayload: ({meId, email}, context) => {
    var localId = fromGlobalId(meId).id;
    return new DAO(context.rootValue.user).Know(localId).create({email});
  }
});

var deleteContact = mutationWithClientMutationId({
  name: 'DeleteContact',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    deletedContactId: {
      type: GraphQLID,
      resolve: ({deletedContactId}) => {
        return toGlobalId('User', deletedContactId);
      },
    },
    me: {
      type: userType,
      resolve: ({me}) => { return me },
    },
  },
  mutateAndGetPayload: ({id}, context) => {
    var localId = fromGlobalId(id).id;
    return new DAO(context.rootValue.user).Know(localId).del();
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
      resolve: ({project}) => { return project; }
    },
    projectEventEdge: {
      type: GraphQLProjectEventEdge,
      resolve: ({projectEventEdge}) => { return projectEventEdge }
    },
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
        testCaseEdge.node.messages = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        testCaseEdge.node.events = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};

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
      resolve: ({fulfillmentEdge}) => {
        fulfillmentEdge.node.events = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};

        return fulfillmentEdge;
      }
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

var didUpdateFulfillment = subscriptionWithClientSubscriptionId({
  name: 'DidUpdateFulfillment',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    testCaseId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    fulfillment: {
      type: fulfillmentType,
      resolve: ({fulfillment}) => { return fulfillment; }
    },
    fulfillmentEventEdge: {
      type: GraphQLFulfillEventEdge,
      resolve: ({fulfillmentEventEdge}) => { return fulfillmentEventEdge }
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
      rootValue.channel = channels.didUpdateFulfillmentChannel(localId);
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
      resolve: ({testCase}) => { return testCase; }
    },
    testCaseEventEdge: {
      type: GraphQLTestCaseEventEdge,
      resolve: ({testCaseEventEdge}) => { return testCaseEventEdge }
    },
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

var didIntroduceCollaborator = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceCollaborator',
  inputFields: {
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    collaboratorEdge: {
      type: GraphQLCollaboratorEdge,
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
        return toGlobalId('Collaborator', deletedCollaboratorId);
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

var didIntroduceInvitee = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceInvitee',
  inputFields: {
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    inviteeEdge: {
      type: GraphQLInviteeEdge,
      resolve: ({inviteeEdge}) => { return inviteeEdge; }
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
      rootValue.channel = channels.didIntroduceInviteeChannel(localId);
      return {projectId};
    }
  }
});

var didDeleteInvitee = subscriptionWithClientSubscriptionId({
  name: 'DidDeleteInvitee',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    deletedInviteeId: {
      type: GraphQLID,
      resolve: ({deletedInviteeId}) => {
        return toGlobalId('Invitee', deletedInviteeId);
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
      rootValue.channel = channels.didDeleteInviteeChannel(localProjectId, localId);
      return {id};
    }
  }
});

var didIntroduceInvitation = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceInvitation',
  inputFields: {
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    invitationEdge: {
      type: GraphQLInvitationEdge,
      resolve: ({invitationEdge}) => {
        return {
          cursor: cursorForObjectInConnection([invitationEdge], invitationEdge),
          node: invitationEdge,
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
      rootValue.channel = channels.didIntroduceInvitationChannel(localId);
      return {meId};
    }
  }
});

var didDeclineInvitation = subscriptionWithClientSubscriptionId({
  name: 'DidDeclineInvitation',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    declinedInvitationId: {
      type: GraphQLID,
      resolve: ({declinedInvitationId}) => {
        return toGlobalId('Invitation', declinedInvitationId);
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
      rootValue.channel = channels.didDeclineInvitationChannel(localMeId, localId);
      return {id};
    }
  }
});

var didAcceptInvitation = subscriptionWithClientSubscriptionId({
  name: 'DidAcceptInvitation',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    collaborationEdge: {
      type: GraphQLProjectEdge,
      resolve: ({collaborationEdge}) => {
        collaborationEdge.collaborators = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        collaborationEdge.testCases = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        collaborationEdge.events = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        return {
          cursor: cursorForObjectInConnection([collaborationEdge], collaborationEdge),
          node: collaborationEdge,
        };
      }
    },
    acceptedInvitationId: {
      type: GraphQLID,
      resolve: ({acceptedInvitationId}) => {
        return toGlobalId('Invitation', acceptedInvitationId);
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
      rootValue.channel = channels.didAcceptInvitationChannel(localMeId, localId);
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
        projectEdge.node.collaborators = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        projectEdge.node.testCases = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};
        projectEdge.node.events = {pageInfo: {hasNextPage: false, hasPreviousPage: false}, edges: []};

        return projectEdge;
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

var didIntroduceMessage = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceMessage',
  inputFields: {
    channelId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    messageEdge: {
      type: GraphQLMessageEdge,
      resolve: ({messageEdge}) => { return messageEdge; }
    },
    channel: {
      type: channelInterface,
      resolve: ({channel}) => {
          // TODO: Fix this, the interface is locked on test case
          channel.id = toGlobalId('TestCase', channel.id);
         return channel
       },
    },
  },
  mutateAndGetPayload: ({channelId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var user = rootValue.user || {};
      var role = user.role;
      if (role) {
        var localId = fromGlobalId(channelId).id;
        rootValue.channel = channels.didIntroduceMessageChannel(role, localId);
      }
      return {channelId};
    }
  }
});

var didIntroduceContact = subscriptionWithClientSubscriptionId({
  name: 'DidIntroduceContact',
  inputFields: {
    meId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    contactEdge: {
      type: GraphQLContactEdge,
      resolve: ({contactEdge}) => { return contactEdge; }
    },
    me: {
      type: userType,
      resolve: ({me}) => { return me; },
    }
  },
  mutateAndGetPayload: ({meId}, {rootValue}) => {
    if (rootValue.event) {
      return rootValue.event;
    } else {
      var localId = fromGlobalId(meId).id;
      rootValue.channel = channels.didIntroduceContactChannel(localId);
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
      acceptInvitation,
      declineInvitation,
      leaveProject,
      deleteCollaborator,
      deleteContact,
      deleteInvitee,
      deleteUserCover,
      deleteProject,
      deleteTestCase,
      deleteUser,
      introduceUserCover,
      introduceContact,
      introduceFulfillment,
      introduceInvitee,
      introduceMessage,
      introduceProject,
      introduceTestCase,
      readChannel,
      updateFulfillment,
      updateProject,
      updateTestCase,
      updateUser,
    }
  }),

  // subscription
  subscription: new GraphQLObjectType({
    name: 'Subscription',
    fields: {
      didAcceptInvitation,
      didDeclineInvitation,
      didDeleteCollaborator,
      didDeleteInvitee,
      didDeleteProject,
      didDeleteTestCase,
      didIntroduceCollaborator,
      didIntroduceContact,
      didIntroduceInvitation,
      didIntroduceInvitee,
      didIntroduceFulfillment,
      didIntroduceMessage,
      didIntroduceProject,
      didIntroduceTestCase,
      didUpdateFulfillment,
      didUpdateProject,
      didUpdateTestCase,
    }
  })
});

export default schema;
