import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getToken() {
  return localStorage.getItem('token');
}

export function getUsername() {
  return localStorage.getItem('username');
}

export function setAuthSession(token, user) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }

  if (user?.username) {
    localStorage.setItem('username', user.username);
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('username');
    localStorage.removeItem('user');
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export async function register({ username, email, password }) {
  const { data } = await api.post('/api/auth/register', { username, email, password });
  setAuthSession(data.token, data.user);
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/api/auth/login', { email, password });
  setAuthSession(data.token, data.user);
  return data;
}

export function logout() {
  setAuthSession(null, null);
}

export async function generateLearning(mode, userInput) {
  const { data } = await api.post('/api/learning/generate', { mode, userInput });
  return data;
}

export default api;
