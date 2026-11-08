/**
 * @fileoverview File / asset URL helpers.
 *
 * The backend serves uploaded and processed files from:
 *   GET /api/files/{category}/{filename}
 */

import { BASE_URL } from './api';

export function getFileUrl(category, filename, token = null) {
  const base = `${BASE_URL}/api/files/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

/**
 * Given a backend-relative image path, return the URL with optional public share token.
 */
export function resolveImageUrl(path, token = null) {
  if (!path) return '';

  let resolved = '';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    resolved = path;
  } else if (path.startsWith('/api/')) {
    resolved = `${BASE_URL}${path}`;
  } else if (path.startsWith('api/')) {
    resolved = `${BASE_URL}/${path}`;
  } else {
    const cleaned = path.replace(/^\/+/, '');
    resolved = `${BASE_URL}/api/files/${cleaned}`;
  }

  if (token && !resolved.includes('token=')) {
    const sep = resolved.includes('?') ? '&' : '?';
    resolved = `${resolved}${sep}token=${encodeURIComponent(token)}`;
  }

  return resolved;
}

export function getThumbnailUrl(filename, token = null) {
  return getFileUrl('previews', filename, token);
}
