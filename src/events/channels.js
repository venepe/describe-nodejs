'use strict';

export const didUpdateProjectChannel = projectId => {
  return `/projects/${projectId}`;
}

export const didIntroduceTestCaseChannel = (projectId) => {
  return `/projects/${projectId}/testcases`;
}

export const didIntroduceFulfillmentChannel = (testCaseId) => {
  return `/testcases/${testCaseId}/fulfillments`;
}

export const didUpdateFulfillmentChannel = (fulfillmentId) => {
  return `/fulfillments/${fulfillmentId}`;
}

export const didDeleteTestCaseChannel = (testCaseId) => {
  return `/testcases/${testCaseId}/delete`;
}

export const didUpdateTestCaseChannel = (testCaseId) => {
  return `/testcases/${testCaseId}/update`;
}

export const didIntroduceCollaboratorChannel = (projectId) => {
  return `/projects/${projectId}/collaborators`;
}

export const didDeleteCollaboratorChannel = (projectId, collaboratorId) => {
  return `/projects/${projectId}/collaborators/${collaboratorId}/delete`;
}

export const didIntroduceCollaborationChannel = (userId) => {
  return `/users/${userId}/collaborations`;
}

export const didDeleteCollaborationChannel = (userId, collaborationId) => {
  return `/users/${userId}/collaborations/${collaborationId}/delete`;
}

export const didIntroduceProjectChannel = (userId) => {
  return `/users/${userId}/projects`;
}

export const didDeleteProjectChannel = (projectId) => {
  return `/projects/${projectId}/delete`;
}

export const didIntroduceInviteeChannel = (projectId) => {
  return `/projects/${projectId}/invitees`;
}

export const didDeleteInviteeChannel = (projectId, inviteeId) => {
  return `/projects/${projectId}/invitees/${inviteeId}/delete`;
}

export const didIntroduceInvitationChannel = (userId) => {
  return `/users/${userId}/invitations`;
}

export const didDeclineInvitationChannel = (userId, inviteeId) => {
  return `/users/${userId}/invitations/${inviteeId}/decline`;
}

export const didAcceptInvitationChannel = (userId, inviteeId) => {
  return `/users/${userId}/invitations/${inviteeId}/accept`;
}

export const didIntroduceMessageChannel = (channelId) => {
  return `/channels/${channelId}/messages`;
}
