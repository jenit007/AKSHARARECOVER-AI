/**
 * @fileoverview Archive search & analytics service.
 */

import api from './api';

/**
 * Full‑text search across all archived manuscripts.
 *
 * @param {string} query – Free‑text search query.
 * @returns {Promise<Object>} Search results (hits, manuscripts, highlights, etc.).
 */
export async function searchArchive(query) {
  const response = await api.get('/api/search', { params: { q: query } });
  return response.data.data;
}

/**
 * Retrieve platform‑wide analytics (manuscript counts, language distribution, etc.).
 *
 * @returns {Promise<Object>} Analytics payload.
 */
export async function getAnalytics() {
  const response = await api.get('/api/analytics');
  return response.data.data;
}
