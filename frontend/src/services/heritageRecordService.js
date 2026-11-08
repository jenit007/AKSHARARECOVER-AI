import api from './api';

export async function getHeritageRecord(manuscriptId, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${manuscriptId}/heritage-record`, { params });
  return response.data.data;
}

export async function setHeritageRecordVisibility(manuscriptId, visibility) {
  const response = await api.patch(`/api/manuscripts/${manuscriptId}/heritage-record/visibility`, {
    visibility,
  });
  return response.data.data;
}

export async function getManuscriptArtifacts(manuscriptId, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${manuscriptId}/artifacts`, { params });
  return response.data.data;
}

export async function getConditionAnalysis(manuscriptId, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${manuscriptId}/condition-analysis`, { params });
  return response.data.data;
}

export async function getProcessingTimeline(manuscriptId, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${manuscriptId}/processing-timeline`, { params });
  return response.data.data;
}
