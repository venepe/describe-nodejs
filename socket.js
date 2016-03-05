import {graphql} from 'graphql';

// import * as events from '../events';
import schema from './src/graphql/schema';


export const connect = socket => {

  let subscriptions = {};

  const rootValue = {
    user : {
      email: 'vpears87@yahoo.com',
      id: 'b0efc121-43b1-4387-b0eb-f3172e0fc8e1',
      role: 'b0efc121_43b1_4387_b0eb_f3172e0fc8e1',
      expires: 1457654868231
    }
  };

  socket.on('disconnect', () => {
    console.log('disconnect');
    // Object.values(subscriptions).forEach(({channel,listener}) =>
    //   events.unsubscribe(channel, listener)
    // )
  });

  socket.on('graphql/queries', requests => {
    requests.forEach(request => {
      execute(schema, request.query, rootValue, request.variables).then(response => {
        socket.emit('graphql/query/response', {
          id: request.id,
          ...response
        });
      });
    });
  });

  socket.on('graphql/mutation', request => {
    execute(schema, request.query, rootValue, request.variables).then(response => {
      socket.emit('graphql/mutation/response', {
        id: request.id,
        ...response
      });
    });
  });

  // socket.on('graphql/subscription', async request => {
  //   const channel = await events.channelForSubscription(request);
  //   const listener = ev => handleSubscription(request, ev);
  //
  //   subscriptions[request.id] = {
  //     channel,
  //     listener
  //   }
  //
  //   events.subscribe(channel, listener);
  // });
  //
  // socket.on('graphql/subscription/unsubscribe', ({id}) => {
  //   const {channel,listener} = subscriptions[id];
  //   events.unsubscribe(channel, listener);
  //   delete subscriptions[id];
  // });
  //
  // const handleSubscription = (request, event) => {
  //   execute(schema, request.query, {...rootValue, event }, request.variables).then(response => {
  //     socket.emit('graphql/subscription/response', {
  //       id: request.id,
  //       ...response
  //     });
  //   });
  // }

}

const execute = (schema, query, rootValue, variables, operationName) => {
  return graphql(schema, query, rootValue, variables, operationName)
    .catch(error => ({errors: [error]}));
}
