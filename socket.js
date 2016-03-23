import {graphql} from 'graphql';

import * as events from './src/events';
import schema from './src/graphql/schema';

///files
import {FileConfig} from './src/config';
const fs = require('fs');
const mmm = require('mmmagic');
const del = require('del');
const mv = require('mv');
const Magic = mmm.Magic;
const uuid = require('node-uuid');

export const connect = socket => {

  let subscriptions = {};
  let rootValue = {};

  socket.on('disconnect', () => {
    Object.values(subscriptions).forEach(({channel, listener}) =>
      events.unsubscribe(channel, listener)
    )
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
    uploadFiles(request).then(request => {
      execute(schema, request.query, rootValue, request.variables).then(response => {
        socket.emit('graphql/mutation/response', {
          id: request.id,
          ...response
        });
      });
    })
    .catch(error => {
      socket.emit('graphql/mutation/response', {
        id: request.id,
        errors: [error]
      });
    });
  });

  socket.on('graphql/subscription', async request => {
    const channel = await events.channelForSubscription(request);
    const listener = ev => handleSubscription(request, ev);
    console.log(channel);

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

function uploadFiles(request) {
  return new Promise((resolve, reject) => {
    if (request.files && request.files.length > 0) {
      let file = request.files[0];
      let variables = request.variables;
      let filename = uuid.v4();
      let tempPath = __dirname + FileConfig.TempDir + filename;
      let filePath = __dirname + FileConfig.UploadDir + filename;
      fs.writeFile(tempPath, file, function(err) {
        if (!err) {
          console.log(`success: ${filePath}`);
          let magic = new Magic(mmm.MAGIC_MIME_TYPE);
          let re = /(jpeg|jpg|png)$/i;
          magic.detectFile(tempPath, (err, result) => {
            console.log(result);
            if (err || !result.match(re)) {
              console.log(`Invalid file type: ${tempPath}`);
              let error = {message: 'Invalid file type.'};
              del([tempPath])
                .then((paths) => {
                  reject(error);
                })
                .catch(err => {
                  reject(error);
                });
            } else {
              mv(tempPath, filePath, function(err) {
                if (err) {
                  console.log(`Failed to move image: ${filePath}`);
                  let error = {message: 'Error on upload.'};
                  reject(error);
                } else {
                  console.log(`moved image: ${filePath}`);
                  let input = variables.input || variables.input_0;
                  input.uri = filePath.replace(__dirname + '/public', FileConfig.BaseImageUrl);
                  variables.input = input;
                  request.variables = variables;
                  resolve(request);
                }
              });
            }
          });
        } else {
          let error = {message: 'Error on upload.'};
          reject(error);
        }
      });
    } else {
      resolve(request);
    }
  });
}
