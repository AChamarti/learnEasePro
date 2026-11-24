import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

export function resolveMediaUrl(rawUrl) {
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('data:')) return rawUrl;
  try {
    return new URL(rawUrl, api.defaults.baseURL).toString();
  } catch {
    return rawUrl;
  }
}

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('lep_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) window.dispatchEvent(new Event('lep:session-expired'));
  return Promise.reject(error);
});

export default api;
