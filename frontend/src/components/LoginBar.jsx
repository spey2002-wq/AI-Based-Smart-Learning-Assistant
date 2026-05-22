import { useState } from 'react';
import { login, register, logout, getStoredUser, isLoggedIn } from '../api/auth';

export default function LoginBar({ onAuthChange }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const loggedIn = isLoggedIn() && user;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data =
        tab === 'login'
          ? await login({ email: form.email, password: form.password })
          : await register(form);
      setUser(data.user);
      setOpen(false);
      setForm({ name: '', email: '', password: '' });
      onAuthChange?.(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    onAuthChange?.(false);
  }

  return (
    <div className="login-bar">
      <div className="login-bar__row">
        {loggedIn ? (
          <>
            <span className="login-bar__greeting">
              Signed in as <strong>{user.name}</strong>
            </span>
            <button type="button" className="login-bar__btn login-bar__btn--ghost" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <span className="login-bar__hint">Sign in to save your study history</span>
            <button
              type="button"
              className="login-bar__btn login-bar__btn--primary"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? 'Close' : 'Login / Register'}
            </button>
          </>
        )}
      </div>

      {open && !loggedIn && (
        <div className="login-bar__panel">
          <div className="login-bar__tabs">
            <button
              type="button"
              className={tab === 'login' ? 'login-bar__tab--active' : ''}
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={tab === 'register' ? 'login-bar__tab--active' : ''}
              onClick={() => setTab('register')}
            >
              Register
            </button>
          </div>
          <form onSubmit={handleSubmit} className="login-bar__form">
            {tab === 'register' && (
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
              placeholder="Password (min 8 characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
            {error && <p className="login-bar__error">{error}</p>}
            <button type="submit" className="login-bar__btn login-bar__btn--primary" disabled={loading}>
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
