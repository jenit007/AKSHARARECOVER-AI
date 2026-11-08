/**
 * @fileoverview Processing pipeline service.
 *
 * Handles triggering image‑enhancement / OCR jobs and polling for
 * their completion status.
 */

import api from './api';

/**
 * Start the processing pipeline for a manuscript.
 *
 * @param {string} manuscriptId – Manuscript UUID.
 * @param {Object} [options]
 * @param {boolean} [options.enhancement_enabled] – Run image enhancement.
 * @param {boolean} [options.ocr_enabled]         – Run OCR / transcription.
 * @param {boolean} [options.compare_original]    – Generate before/after comparison.
 * @param {string}  [options.source_language]     – Language code hint.
 * @param {string}  [options.source_script]       – Script name hint.
 * @returns {Promise<Object>} Job descriptor with `job_id`, initial status, etc.
 */
export async function startProcessing(manuscriptId, options = {}) {
  const response = await api.post(`/api/manuscripts/${manuscriptId}/process`, {
    enhancement_enabled: options.enhancement_enabled ?? true,
    ocr_enabled: options.ocr_enabled ?? true,
    compare_original: options.compare_original ?? true,
    source_language: options.source_language,
    source_script: options.source_script,
  });
  return response.data.data;
}

/**
 * Fetch the current status of a background processing job.
 *
 * @param {string} jobId – Job UUID.
 * @returns {Promise<Object>} Job status record (status, progress, result, etc.).
 */
export async function getJobStatus(jobId) {
  const response = await api.get(`/api/jobs/${jobId}`);
  return response.data.data;
}

/**
 * Poll a job's status at a fixed interval until it reaches a terminal state
 * (`completed` or `failed`).
 *
 * @param {string}   jobId      – Job UUID.
 * @param {Function} onUpdate   – Callback invoked with the status payload on every tick.
 * @param {number}   [intervalMs=2000] – Polling interval in milliseconds.
 * @returns {Promise<Object>} The final job status payload once terminal.
 */
export function pollJobStatus(jobId, onUpdate, intervalMs = 2000) {
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const status = await getJobStatus(jobId);
        onUpdate?.(status);

        const state = (status.status ?? '').toLowerCase();

        if (state === 'completed' || state === 'success') {
          resolve(status);
          return;
        }

        if (state === 'failed' || state === 'error') {
          reject({
            message: status.error || 'Processing job failed.',
            code: 'JOB_FAILED',
            details: status,
          });
          return;
        }

        // Still running – schedule next tick.
        timerId = setTimeout(tick, intervalMs);
      } catch (err) {
        reject(err);
      }
    };

    let timerId = setTimeout(tick, 0); // kick off immediately

    // Expose a cancel handle via the promise (non‑standard but handy).
    // Callers can do:  const p = pollJobStatus(…); p.cancel?.();
    // eslint-disable-next-line no-param-reassign
    pollJobStatus._cancel = () => clearTimeout(timerId);
  });
}
