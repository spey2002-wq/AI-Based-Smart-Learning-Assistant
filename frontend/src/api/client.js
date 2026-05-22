const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export function register(body) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function login(body) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function generateLearning(userInput, mode) {
  return request('/api/learning/generate', {
    method: 'POST',
    body: JSON.stringify({ userInput, mode }),
  });
}
