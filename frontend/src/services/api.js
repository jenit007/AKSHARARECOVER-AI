import axios from 'axios';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL =
  import.meta.env.DEV &&
  (rawBaseUrl === 'http://localhost:8000' || rawBaseUrl === 'http://127.0.0.1:8000')
    ? ''
    : rawBaseUrl;

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie('akshara_csrf') || getCookie('akshara_csrf_token');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const errorDetails = error.response?.data?.error || null;
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred';

    // Dispatch session expired event if a protected API call returns 401 (ignoring initial /auth/me check)
    if (
      status === 401 &&
      !url.includes('/api/auth/me') &&
      !url.includes('/api/auth/login') &&
      typeof window !== 'undefined'
    ) {
      window.dispatchEvent(new CustomEvent('akshara:unauthorized'));
    }

    if (status !== 401 || (!url.includes('/api/auth/me') && !url.includes('/api/auth/login'))) {
      console.error(`[API Error] ${url}:`, message, errorDetails);
    }
    return Promise.reject(error);
  },
);

export default api;
export { API_BASE_URL, API_BASE_URL as BASE_URL };
