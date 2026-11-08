/**
 * @fileoverview Translation generation & editing service.
 */

import api from './api';

/**
 * Request an AI‑generated translation for a manuscript.
 *
 * @param {string} manuscriptId – Manuscript UUID.
 * @param {Object} options
 * @param {string} options.source_text       – The transcription text to translate.
 * @param {string} options.source_language   – Source language code (e.g. "ml").
 * @param {string} options.target_language   – Target language code (e.g. "en").
 * @param {string} [options.translation_mode] – "literal" | "contextual" | "scholarly".
 * @returns {Promise<Object>} Translation result payload.
 */
export async function generateTranslation(manuscriptId, {
  source_text,
  source_language,
  target_language,
  translation_mode,
} = {}) {
  const response = await api.post(`/api/manuscripts/${manuscriptId}/translate`, {
    source_text,
    source_language,
    target_language,
    translation_mode,
  });
  return response.data.data;
}

/**
 * Submit a corrected / edited translation.
 *
 * @param {string} manuscriptId – Manuscript UUID.
 * @param {Object} body
 * @param {string} body.corrected_translation – The corrected translation text.
 * @param {string} body.reviewer              – Reviewer name / ID.
 * @param {string} [body.notes]               – Optional reviewer notes.
 * @returns {Promise<Object>} Updated translation record.
 */
export async function editTranslation(manuscriptId, {
  corrected_translation,
  reviewer,
  notes,
} = {}) {
  const response = await api.patch(`/api/manuscripts/${manuscriptId}/translation`, {
    corrected_translation,
    reviewer,
    notes,
  });
  return response.data.data;
}
