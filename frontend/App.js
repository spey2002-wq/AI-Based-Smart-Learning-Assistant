import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

const API_URL = 'http://localhost:5000/api/learning/generate';

function App() {
  const [mode, setMode] = useState('explain');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return alert('Please enter some text or notes first!');

    setLoading(true);
    setOutput('');

    try {
      const response = await axios.post(API_URL, { mode, userInput });
      const data = response.data;
      setOutput(data.content || data.result || '');
    } catch (error) {
      console.error('Error communicating with AI backend:', error);
      setOutput(
        'Oops! Failed to connect to the learning assistant server. Make sure your backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Smart Assistant</h2>
        <nav>
          {['explain', 'summary', 'quiz', 'revision'].map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? 'active-nav-btn' : 'nav-btn'}
              onClick={() => {
                setMode(m);
                setOutput('');
              }}
            >
              {m.toUpperCase()} Mode
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <h1>
            Active Mode: <span className="highlight">{mode.toUpperCase()}</span>
          </h1>
          <p>Paste your textbook chapters, class notes, or complex topics below to process.</p>
        </header>

        <div className="split-view">
          <form onSubmit={handleSubmit} className="input-panel">
            <textarea
              placeholder={`Paste your studying material here for ${mode} mode...`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Processing with AI...' : `Generate ${mode.toUpperCase()}`}
            </button>
          </form>

          <div className="output-panel">
            <h3>AI Generated Study Output</h3>
            {loading && (
              <div className="spinner">Analyzing notes and structuring response...</div>
            )}
            {!loading && output && (
              <div className="output-content markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
              </div>
            )}
            {!loading && !output && (
              <p className="placeholder-text">Your study guide will appear here.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
