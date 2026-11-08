/**
 * @fileoverview Community contribution submission service connected to `/api/contributions`.
 */

import api from './api';

/**
 * Submit a community contribution to the database-backed archival ledger.
 *
 * @param {FormData} formData – FormData containing file and provenance metadata.
 * @returns {Promise<Object>} Created contribution record.
 */
export async function submitContribution(formData) {
  const response = await api.post('/api/contributions', formData);
  return response.data.data;
}

/**
 * List community contributions for the current user.
 */
export async function listContributions() {
  const response = await api.get('/api/contributions');
  return response.data.data;
}
