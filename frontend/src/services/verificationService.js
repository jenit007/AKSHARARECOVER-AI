/**
 * @fileoverview Manuscript verification (scholarly review) service.
 */

import api from './api';

/**
 * Submit a verification decision for a manuscript.
 *
 * @param {string} manuscriptId – Manuscript UUID.
 * @param {Object} body
 * @param {string} body.verification_status    – "verified" | "rejected" | "needs_revision".
 * @param {string} body.reviewer               – Reviewer name / ID.
 * @param {string} [body.reviewer_notes]       – Free‑text notes from the reviewer.
 * @param {number} [body.transcription_version] – Version of transcription being verified.
 * @param {number} [body.translation_version]   – Version of translation being verified.
 * @returns {Promise<Object>} Verification record.
 */
export async function verifyManuscript(manuscriptId, {
  verification_status,
  reviewer,
  reviewer_notes,
  transcription_version,
  translation_version,
} = {}) {
  const response = await api.post(`/api/manuscripts/${manuscriptId}/verify`, {
    verification_status,
    reviewer,
    reviewer_notes,
    transcription_version,
    translation_version,
  });
  return response.data.data;
}
