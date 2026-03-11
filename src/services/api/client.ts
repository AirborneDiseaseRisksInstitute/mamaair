import axios from 'axios';
import { storage } from '../../store/useAuthStore';

// Use the production URL or development URL as appropriate
const BASE_URL = 'https://api.mamaair.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'super-secret-mobile-key',
  },
});

api.interceptors.request.use(config => {
  const token = storage.getString('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
