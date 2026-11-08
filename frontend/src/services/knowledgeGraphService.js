import api from './api';

/**
 * Fetch the knowledge graph for a single manuscript.
 * Endpoint: GET /api/manuscripts/{manuscriptId}/knowledge-graph
 */
export async function getKnowledgeGraph(manuscriptId) {
  const response = await api.get(`/api/manuscripts/${manuscriptId}/knowledge-graph`);
  return response.data.data;
}

/**
 * Trigger knowledge graph generation for a manuscript.
 * Endpoint: POST /api/manuscripts/{manuscriptId}/knowledge-graph/generate
 */
export async function generateKnowledgeGraph(manuscriptId) {
  const response = await api.post(`/api/manuscripts/${manuscriptId}/knowledge-graph/generate`);
  return response.data.data;
}

/**
 * Retrieve extracted cultural entities for a manuscript.
 * Endpoint: GET /api/manuscripts/{manuscriptId}/cultural-entities
 */
export async function getCulturalEntities(manuscriptId) {
  const response = await api.get(`/api/manuscripts/${manuscriptId}/cultural-entities`);
  return response.data.data;
}
