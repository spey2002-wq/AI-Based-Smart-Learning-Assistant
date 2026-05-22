import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import QuizDisplay from './QuizDisplay';
import { extractQuizFromResponse } from '../utils/parseQuiz';
import '../styles/Dashboard.css';

const API_URL = 'http://localhost:5000/api/learning/generate';

const MODES = [
  { id: 'explain', label: 'Explain', hint: 'Plain-language breakdown with analogies' },
  { id: 'summary', label: 'Summary', hint: 'High-yield bullet study sheets' },
  { id: 'quiz', label: 'Quiz', hint: '3 multiple-choice questions' },
  { id: 'revision', label: 'Revision', hint: 'Last-minute flashcard points' },
];

export default function SmartLearningDashboard() {
  const [activeMode, setActiveMode] = useState('explain');
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeMeta = MODES.find((m) => m.id === activeMode);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!userInput.trim()) {
      setError('Please type or paste your notes before submitting.');
      return;
    }

    setError('');
    setLoading(true);
    setResponse('');
    setQuizData(null);

    try {
      const { data } = await axios.post(API_URL, {
        mode: activeMode,
        userInput: userInput.trim(),
      });

      if (activeMode === 'quiz') {
        const parsed = extractQuizFromResponse(data);
        if (parsed.length > 0) {
          setQuizData(parsed);
          setResponse('');
        } else {
          setResponse(data.content || '');
          setError('Could not parse quiz JSON. Try generating again.');
        }
      } else {
        setResponse(data.content || '');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Could not reach the learning API.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(modeId) {
    setActiveMode(modeId);
    setResponse('');
    setQuizData(null);
    setError('');
  }

  return (
    <div className="sla-dashboard">
      <aside className="sla-sidebar">
        <header className="sla-sidebar__header">
          <h1 className="sla-sidebar__title">Smart Learning</h1>
          <p className="sla-sidebar__subtitle">AI study assistant</p>
        </header>

        <nav className="sla-sidebar__nav" aria-label="Learning modes">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`sla-sidebar__btn ${activeMode === mode.id ? 'sla-sidebar__btn--active' : ''}`}
              onClick={() => handleModeChange(mode.id)}
              aria-pressed={activeMode === mode.id}
            >
              <span className="sla-sidebar__btn-label">{mode.label}</span>
              <span className="sla-sidebar__btn-hint">{mode.hint}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="sla-main">
        <header className="sla-main__header">
          <h2>{activeMeta?.label} mode</h2>
          <p>{activeMeta?.hint}</p>
        </header>

        <div className="sla-workspace">
          <section className="sla-input-panel">
            <form className="sla-input-form" onSubmit={handleSubmit}>
              <label className="sla-label" htmlFor="student-notes">
                Your notes or question
              </label>
              <textarea
                id="student-notes"
                className="sla-textarea"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Paste lecture notes, textbook excerpts, or type a topic you want to study…"
                disabled={loading}
                rows={14}
              />
              <div className="sla-input-footer">
                <span className="sla-char-count">
                  {userInput.trim() ? userInput.trim().split(/\s+/).length : 0} words
                </span>
                <button type="submit" className="sla-submit" disabled={loading}>
                  {loading ? 'Generating…' : `Generate ${activeMeta?.label}`}
                </button>
              </div>
              {error && (
                <p className="sla-error" role="alert">
                  {error}
                </p>
              )}
            </form>
          </section>

          <section className="sla-response-panel" aria-live="polite">
            <h3 className="sla-response-panel__title">Response</h3>

            {loading && (
              <div className="sla-loading">
                <div className="sla-loading__spinner" aria-hidden />
                <p className="sla-loading__text">Preparing your {activeMeta?.label} content…</p>
                <p className="sla-loading__sub">This may take a few seconds.</p>
              </div>
            )}

            {!loading && !response && !quizData && (
              <div className="sla-empty">
                <p>Your AI-generated content will appear here.</p>
              </div>
            )}

            {!loading && activeMode === 'quiz' && quizData && (
              <div className="sla-response-content">
                <QuizDisplay quiz={quizData} />
              </div>
            )}

            {!loading && response && !(activeMode === 'quiz' && quizData) && (
              <div className="sla-response-content sla-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
