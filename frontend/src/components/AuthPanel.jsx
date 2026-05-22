import { useState } from 'react';
import { hasAuthToken, loginUser, registerUser, setAuthToken } from '../api/axiosClient';

export default function AuthPanel({ onAuthChange }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loggedIn = hasAuthToken();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginUser({ email: form.email, password: form.password });
      } else {
        await registerUser(form);
      }
      onAuthChange?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setAuthToken(null);
    onAuthChange?.();
  }

  if (loggedIn) {
    return (
      <div className="auth-panel">
        <p className="auth-panel__status">Signed in</p>
        <button type="button" className="auth-panel__btn auth-panel__btn--ghost" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <div className="auth-panel__tabs">
        <button
          type="button"
          className={mode === 'login' ? 'auth-panel__tab auth-panel__tab--active' : 'auth-panel__tab'}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'auth-panel__tab auth-panel__tab--active' : 'auth-panel__tab'}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>
      <form className="auth-panel__form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
          required
        />
        {error && <p className="auth-panel__error">{error}</p>}
        <button type="submit" className="auth-panel__btn" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
