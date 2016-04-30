import { graphql } from 'graphql';
import { fromGlobalId } from 'graphql-relay';

import * as events from './src/events';
import schema from './src/graphql/schema';

export const connect = socket => {

  let subscriptions = {};
  let user = socket.decoded_token || {};
  if (user.id) {
    user.id = fromGlobalId(user.id).id;
  }
  let rootValue = {user};

  socket.on('disconnect', () => {
    Object.values(subscriptions).forEach(({channel, listener}) =>
      events.unsubscribe(channel, listener)
    )
  });

  socket.on('graphql/subscription', async request => {
    const channel = await events.channelForSubscription(request);
    const listener = ev => handleSubscription(request, ev);

    subscriptions[request.id] = {
      channel,
      listener
    }

    events.subscribe(channel, listener);
  });

  socket.on('graphql/subscription/unsubscribe', ({id}) => {
    const {channel,listener} = subscriptions[id];
    events.unsubscribe(channel, listener);
    delete subscriptions[id];
  });

  const handleSubscription = (request, event) => {
    execute(schema, request.query, {...rootValue, event }, request.variables).then(response => {
      socket.emit('graphql/subscription/response', {
        id: request.id,
        ...response
      });
    });
  }
}

const execute = (schema, query, rootValue, variables, operationName) => {
  return graphql(schema, query, rootValue, variables, operationName)
    .catch(error => ({errors: [error]}));
}
