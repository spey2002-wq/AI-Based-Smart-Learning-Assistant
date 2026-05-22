import { useState } from 'react';
import { login, register } from '../api/auth';

export default function AuthGate({ onAuthenticated }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data =
        tab === 'login'
          ? await login({ email: form.email, password: form.password })
          : await register({
              username: form.username,
              email: form.email,
              password: form.password,
            });

      onAuthenticated(data.user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__brand-inner">
            <h1>Smart Learning Assistant</h1>
            <p>
              Turn your notes into explanations, summaries, quizzes, and revision sheets — powered
              by AI.
            </p>
            <ul className="auth-card__features">
              <li>Explain complex topics simply</li>
              <li>Build high-yield summaries</li>
              <li>Practice with interactive quizzes</li>
            </ul>
          </div>
        </div>

        <div className="auth-card__form-panel">
          <div className="auth-card__tabs">
            <button
              type="button"
              className={tab === 'login' ? 'auth-card__tab auth-card__tab--active' : 'auth-card__tab'}
              onClick={() => {
                setTab('login');
                setError('');
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={
                tab === 'register' ? 'auth-card__tab auth-card__tab--active' : 'auth-card__tab'
              }
              onClick={() => {
                setTab('register');
                setError('');
              }}
            >
              Register
            </button>
          </div>

          <h2 className="auth-card__heading">
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="auth-card__subheading">
            {tab === 'login'
              ? 'Sign in to access your learning dashboard.'
              : 'Join free and start studying smarter today.'}
          </p>

          <form className="auth-card__form" onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div className="auth-card__field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>
            )}

            <div className="auth-card__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@school.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-card__field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <p className="auth-card__error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="auth-card__submit" disabled={loading}>
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
