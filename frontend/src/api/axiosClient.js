import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000';
export const GENERATE_ENDPOINT = `${API_BASE_URL}/api/learning/generate`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem('token'));
}

export async function registerUser(body) {
  const { data } = await api.post('/api/auth/register', body);
  return data;
}

export async function loginUser(body) {
  const { data } = await api.post('/api/auth/login', body);
  return data;
}

export async function generateLearning(mode, userInput) {
  const { data } = await axios.post(
    GENERATE_ENDPOINT,
    { mode, userInput },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    }
  );
  return data;
}

export default api;
