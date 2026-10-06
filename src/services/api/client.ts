import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { resetToAuthLoading } from '../../App/navigationRef';
import { DEV_LOCAL_SESSION } from '../../config/dev';

const BASE_URL = 'https://api.mamaair.work/api';

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
  },
  transformResponse: [safeJsonTransform],
});

const AUTH_ENDPOINT_PREFIXES = [
  '/auth/token/',
  '/auth/token/refresh/',
  '/auth/email/login/',
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
  const token = useAuthStore.getState().token;
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

    const currentAccessToken = useAuthStore.getState().token;
    const requestAuthorization = original.headers?.Authorization;
    if (
      requestAuthorization &&
      currentAccessToken &&
      requestAuthorization !== `Bearer ${currentAccessToken}`
    ) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      await useAuthStore.getState().clearSession().catch(() => {});
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
        { headers: { 'Content-Type': 'application/json' } },
      );

      const newToken: string = data?.access;
      if (!newToken) {
        throw new Error('Token refresh returned no access token.');
      }
      if (useAuthStore.getState().refreshToken !== refreshToken) {
        throw new Error('Auth session changed during token refresh.');
      }
      await useAuthStore.getState().setToken(newToken);
      drainQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      const status = (refreshError as any)?.response?.status;
      if (
        useAuthStore.getState().refreshToken === refreshToken &&
        (status === 400 || status === 401 || status === 403)
      ) {
        await useAuthStore.getState().clearSession().catch(() => {});
        resetToAuthLoading();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
