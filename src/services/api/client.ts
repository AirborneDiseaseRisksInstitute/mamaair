import axios from 'axios';
import { storage } from '../../store/useAuthStore';
import { resetToAuthLoading } from '../../App/navigationRef';

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

api.interceptors.request.use(config => {
  const token = storage.getString('auth_token');
  if (token) {
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

    // Only handle 401s, and never retry a refresh call or an already-retried request
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/token/refresh/')
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
