/**
 * @fileoverview Manuscript CRUD, processing journey & export operations.
 *
 * All functions return the unwrapped `data` payload from the
 * standard `{ success, message, data, error }` envelope.
 */

import api from './api';

/**
 * Upload a manuscript image/PDF together with its metadata.
 *
 * @param {File}     file                      – The image or PDF file to upload.
 * @param {Object}   [metadata]
 * @param {string}   [metadata.title]          – Human-readable title.
 * @param {string}   [metadata.description]    – Archival description or notes.
 * @param {string}   [metadata.source_language]– ISO language code (e.g. "mal", "san").
 * @param {string}   [metadata.source_script]  – Script name (e.g. "Malayalam", "Grantha").
 * @param {string}   [metadata.historical_period] – Period / era.
 * @param {string}   [metadata.region]         – Region / provenance.
 * @param {Function} [onUploadProgress]        – Optional progress callback (0..100).
 * @returns {Promise<Object>} Created manuscript record.
 */
export async function uploadManuscript(file, metadata = {}, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);

  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.source_language) formData.append('source_language', metadata.source_language);
  if (metadata.source_script) formData.append('source_script', metadata.source_script);
  if (metadata.historical_period) formData.append('historical_period', metadata.historical_period);
  if (metadata.region) formData.append('region', metadata.region);

  const response = await api.post('/api/manuscripts/upload', formData, {
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(pct);
      }
    },
  });
  return response.data.data;
}

/**
 * List manuscripts for the authenticated user with filtering, sorting & pagination.
 */
export async function listManuscripts(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== ''),
  );
  const response = await api.get('/api/manuscripts', { params: cleanParams });
  return response.data.data;
}

/**
 * Fetch a single manuscript by ID.
 */
export async function getManuscript(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}`, { params });
  return response.data.data;
}

/**
 * Get the processing results for a manuscript.
 */
export async function getManuscriptResults(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/results`, { params });
  return response.data.data;
}

/**
 * Export complete manuscript preservation dossier JSON.
 */
export async function exportManuscriptDossier(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/export`, { params });
  return response.data.data;
}

/**
 * Retrieve comparison data (original vs. enhanced / OCR) for a manuscript.
 */
export async function getManuscriptComparisons(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/compare`, { params });
  return response.data.data;
}

/**
 * Submit a corrected transcription for a manuscript.
 */
export async function correctTranscription(id, { corrected_text, reviewer, notes } = {}) {
  const response = await api.patch(`/api/manuscripts/${id}/transcription`, {
    corrected_text,
    reviewer,
    notes,
  });
  return response.data.data;
}

/**
 * Fetch 32-bin authentic intensity histograms for original and enhanced manuscript images.
 */
export async function getHistogramComparison(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/histogram-comparison`, { params });
  return response.data.data;
}

/**
 * Fetch damage map and detected anomalous regions.
 */
export async function getDamageMap(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/damage-map`, { params });
  return response.data.data;
}

/**
 * Fetch OpenCV physical condition and measured optical metrics.
 */
export async function getConditionAnalysis(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/condition-analysis`, { params });
  return response.data.data;
}

/**
 * Fetch OCR comparison between original and enhanced scans.
 */
export async function getOCRComparison(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/ocr/compare`, { params });
  return response.data.data;
}

/**
 * Fetch extracted cultural entities grounded in the manuscript.
 */
export async function getCulturalEntities(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/cultural-entities`, { params });
  return response.data.data;
}

/**
 * Fetch or generate digital heritage passport record with QR code.
 */
export async function getHeritageRecord(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/heritage-record`, { params });
  return response.data.data;
}

/**
 * Fetch all intermediate and final artifact URLs for a manuscript.
 */
export async function getManuscriptArtifacts(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/artifacts`, { params });
  return response.data.data;
}

/**
 * Fetch 12-stage + 5-stage processing timeline for a manuscript.
 */
export async function getProcessingTimeline(id, token = null) {
  const params = token ? { token } : undefined;
  const response = await api.get(`/api/manuscripts/${id}/processing-timeline`, { params });
  return response.data.data;
}

/**
 * Toggle Digital Heritage Record visibility between 'PRIVATE' and 'PUBLIC'.
 */
export async function setHeritageRecordVisibility(id, visibility) {
  const response = await api.patch(`/api/manuscripts/${id}/heritage-record/visibility`, {
    visibility,
  });
  return response.data.data;
}
