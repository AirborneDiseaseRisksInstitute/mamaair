import axios from 'axios';
import { storage } from '../../store/useAuthStore';
import { resetToAuthLoading } from '../../App/navigationRef';
import { DEV_LOCAL_SESSION } from '../../config/dev';

const BASE_URL = 'https://api.mamaair.work/api';

// Single source of truth for the mobile API key (was duplicated below).
// NOTE: this is still shipped in the bundle — moving it to env/secure storage
// and per-device auth is tracked separately and needs backend coordination.
const API_KEY = 'super-secret-mobile-key';

// Custom transformResponse: axios's default calls JSON.parse on any response with
// Content-Type: application/json — including 204 No Content bodies, which throws.
const safeJsonTransform = (data: any) => {
  if (!data || data === '') return null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
  transformResponse: [safeJsonTransform],
});

const AUTH_ENDPOINT_PREFIXES = [
  '/auth/token/',
  '/auth/token/refresh/',
  '/auth/register/',
  '/auth/email/register/',
  '/auth/email/resend/',
  '/auth/email/verify/',
  '/auth/password-reset/confirm/',
  '/auth/password-reset/request/',
  '/auth/google/',
  '/auth/firebase/',
];

const isAuthEndpoint = (url?: string) =>
  Boolean(url && AUTH_ENDPOINT_PREFIXES.some(prefix => url.includes(prefix)));

api.interceptors.request.use(config => {
  const token = storage.getString('auth_token');
  if (!DEV_LOCAL_SESSION && token && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Prevent concurrent refresh races
let isRefreshing = false;
let waitingQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const drainQueue = (err: any, token: string | null) => {
  waitingQueue.forEach(p => (err ? p.reject(err) : p.resolve(token!)));
  waitingQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;

    if (!original) {
      return Promise.reject(error);
    }

    // An unauthenticated local DEV session expects protected endpoints to
    // reject. Never turn those expected 401s into an auth navigation loop.
    if (DEV_LOCAL_SESSION && error.response?.status === 401) {
      return Promise.reject(error);
    }

    // Auth endpoints should surface their own validation errors to the caller.
    // Retrying/redirecting here hides the real Google/login failure behind an
    // AuthLoading reset loop.
    if (isAuthEndpoint(original?.url)) {
      return Promise.reject(error);
    }

    // Only handle 401s, and never retry an already-retried request
    if (
      error.response?.status !== 401 ||
      original._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = storage.getString('auth_refresh_token');
    if (!refreshToken) {
      storage.remove('auth_token');
      storage.remove('auth_refresh_token');
      resetToAuthLoading();
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request until it resolves
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        waitingQueue.push({ resolve, reject });
      }).then(newToken => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Use plain axios to avoid triggering this interceptor again
      const { data } = await axios.post(
        `${BASE_URL}/auth/token/refresh/`,
        { refresh: refreshToken },
        { headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY } },
      );

      const newToken: string = data.access;
      storage.set('auth_token', newToken);
      drainQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      storage.remove('auth_token');
      storage.remove('auth_refresh_token');
      resetToAuthLoading();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
