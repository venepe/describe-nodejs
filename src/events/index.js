import EventEmitter from 'events';

// wrap event emitter to make events emit asynchronously
const events = new EventEmitter();
events.setMaxListeners(1000);

export const publish = (channel, event) => {
  setImmediate(() => events.emit(channel, event));
}

export const subscribe = (channel, listener) => {
  events.addListener(channel, listener);
  console.log(events.getMaxListeners());
  console.log(events.listenerCount(channel));
}

export const unsubscribe = (channel, listener) => {
  console.log(`unsubscribe from ${channel}`);
  events.removeListener(channel, listener);
}

export { channelForSubscription } from './graphql';
export { didUpdateProjectChannel, didIntroduceTestCaseChannel, didDeleteCollaboratorChannel, didDeleteCollaborationChannel, didIntroduceFulfillmentChannel, didDeleteFulfillmentChannel, didDeleteTestCaseChannel, didUpdateTestCaseChannel, didIntroduceCollaborationChannel, didIntroduceExampleChannel, didDeleteExampleChannel, didIntroduceCoverImageChannel, didDeleteCoverImageChannel, didIntroduceCollaboratorChannel, didDeleteProjectChannel, didIntroduceProjectChannel } from './channels';
