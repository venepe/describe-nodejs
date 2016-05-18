import EventEmitter from 'events';

// wrap event emitter to make events emit asynchronously
const events = new EventEmitter();
events.setMaxListeners(1000);

export const publish = (channel, event) => {
  setImmediate(() => events.emit(channel, event));
}

export const subscribe = (channel, listener) => {
  events.addListener(channel, listener);
}

export const unsubscribe = (channel, listener) => {
  events.removeListener(channel, listener);
}

export { channelForSubscription } from './graphql';

export { didUpdateProjectChannel, didIntroduceTestCaseChannel, didDeleteCollaboratorChannel,
  didDeleteCollaborationChannel, didIntroduceFulfillmentChannel, didUpdateFulfillmentChannel,
  didDeleteTestCaseChannel, didUpdateTestCaseChannel, didIntroduceCollaborationChannel,
  didIntroduceCollaboratorChannel, didDeleteProjectChannel, didIntroduceProjectChannel,
  didIntroduceInviteeChannel, didDeleteInviteeChannel, didIntroduceInvitationChannel,
  didDeclineInvitationChannel, didAcceptInvitationChannel } from './channels';
