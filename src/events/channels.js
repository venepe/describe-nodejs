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

export const didRejectFulfillmentChannel = (testCaseId, fulfillmentId) => {
  return `/testcases/${testCaseId}/fulfillments/${fulfillmentId}`;
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
