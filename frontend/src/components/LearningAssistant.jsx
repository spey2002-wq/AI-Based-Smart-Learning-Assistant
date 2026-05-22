import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateLearning, isLoggedIn } from '../api/client.js';
import AuthBar from './AuthBar.jsx';

const MODES = [
  {
    id: 'explain',
    label: 'Explain',
    description: 'Clear step-by-step explanations',
    icon: '💡',
  },
  {
    id: 'summary',
    label: 'Summary',
    description: 'Concise bullet-point notes',
    icon: '📝',
  },
  {
    id: 'quiz',
    label: 'Quiz',
    description: 'Multiple-choice practice questions',
    icon: '❓',
  },
  {
    id: 'revision',
    label: 'Revision',
    description: 'Key facts and recall questions',
    icon: '🔄',
  },
];

export default function LearningAssistant() {
  const [mode, setMode] = useState('explain');
  const [notes, setNotes] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authTick, setAuthTick] = useState(0);

  const activeMode = MODES.find((m) => m.id === mode);
  const loggedIn = isLoggedIn();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Paste your notes or enter a topic first.');
      return;
    }
    if (!loggedIn) {
      setError('Please sign in to generate content.');
      return;
    }

    setError('');
    setLoading(true);
    setOutput('');

    try {
      const data = await generateLearning(notes.trim(), mode);
      setOutput(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar — modes */}
      <aside className="flex w-full flex-col border-b border-slate-800 bg-slate-900/80 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-800 px-4 py-5">
          <h1 className="font-display text-xl font-bold tracking-tight text-white">
            AI Learning
          </h1>
          <p className="mt-1 text-xs text-slate-400">Assistant</p>
        </div>

        <AuthBar onAuthChange={() => setAuthTick((t) => t + 1)} key={authTick} />

        <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:p-4 lg:pt-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex min-w-[140px] flex-1 items-start gap-3 rounded-xl border px-3 py-3 text-left transition lg:min-w-0 lg:w-full ${
                mode === m.id
                  ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-lg shadow-indigo-900/30'
                  : 'border-transparent bg-slate-800/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span className="text-lg" aria-hidden>
                {m.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="mt-0.5 hidden text-xs text-slate-400 sm:block lg:block">
                  {m.description}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Input column */}
      <section className="flex min-h-0 flex-1 flex-col border-b border-slate-800 lg:border-b-0 lg:border-r">
        <header className="border-b border-slate-800 px-4 py-4 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-white">
            {activeMode?.label} mode
          </h2>
          <p className="mt-1 text-sm text-slate-400">{activeMode?.description}</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col p-4 sm:p-6">
          <label htmlFor="notes" className="mb-2 text-sm font-medium text-slate-300">
            Your notes or topic
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your lecture notes, textbook excerpt, or type a topic you want to study…"
            className="min-h-[200px] flex-1 resize-y rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 lg:min-h-[320px]"
            disabled={loading}
          />

          {error && (
            <p className="mt-3 rounded-lg bg-rose-950/50 px-3 py-2 text-sm text-rose-300" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !loggedIn}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[180px]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating…
              </span>
            ) : (
              'Generate'
            )}
          </button>
        </form>
      </section>

      {/* Markdown output */}
      <section className="flex min-h-[280px] flex-1 flex-col bg-slate-900/40 lg:max-w-xl xl:max-w-2xl">
        <header className="border-b border-slate-800 px-4 py-4 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-white">Response</h2>
          <p className="mt-1 text-sm text-slate-400">
            AI-generated {activeMode?.label.toLowerCase()} content
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading && !output && (
            <div className="flex h-full min-h-[200px] items-center justify-center text-slate-500">
              <p className="text-sm">Waiting for Gemini…</p>
            </div>
          )}

          {!loading && !output && (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-6 text-center">
              <p className="text-sm text-slate-500">
                Your generated content will appear here as formatted markdown.
              </p>
            </div>
          )}

          {output && (
            <article className="markdown-output rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
