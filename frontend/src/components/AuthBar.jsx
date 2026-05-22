import { useState } from 'react';
import { login, register, setToken, isLoggedIn } from '../api/client.js';

export default function AuthBar({ onAuthChange }) {
  const [open, setOpen] = useState(!isLoggedIn());
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loggedIn = isLoggedIn();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;
      const data = await fn(payload);
      setToken(data.token);
      setOpen(false);
      onAuthChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setOpen(true);
    onAuthChange?.();
  }

  if (loggedIn && !open) {
    return (
      <div className="border-b border-slate-800 px-4 py-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-800 p-4">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
            mode === 'login'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
            mode === 'register'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          Register
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        {mode === 'register' && (
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          minLength={8}
          required
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
