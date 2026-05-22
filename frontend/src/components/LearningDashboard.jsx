import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { readTextFile } from '../utils/readTextFile';
import { generateLearning } from '../api/auth';

const ACCEPTED_FILE_TYPES = '.txt,.md,.csv,.json,.html,.htm,text/plain';

export default function LearningDashboard({ username, onLogout }) {
  const [mode, setMode] = useState('explain');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedQuiz, setParsedQuiz] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setOutput('');
    setParsedQuiz([]);
    setQuizComplete(false);
  }, [mode]);

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setFileError('');

    for (const file of files) {
      try {
        const text = await readTextFile(file);
        const block = `--- ${file.name} ---\n${text.trim()}`;
        setUserInput((prev) => (prev.trim() ? `${prev.trim()}\n\n${block}` : block));
        setAttachedFiles((prev) => [
          ...prev,
          { id: `${file.name}-${file.lastModified}`, name: file.name },
        ]);
      } catch (err) {
        setFileError(err.message);
      }
    }

    e.target.value = '';
  }

  function removeAttachedFile(id) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return alert('Please paste notes or add a text file first!');

    setLoading(true);
    setOutput('');
    setParsedQuiz([]);
    setQuizComplete(false);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);

    try {
      const data = await generateLearning(mode, userInput.trim());
      const aiResult = data.content || data.result || '';
      setOutput(aiResult);

      if (mode === 'quiz') {
        try {
          const cleanJsonString = aiResult.replace(/```json|```/g, '').trim();
          const jsonQuiz = JSON.parse(cleanJsonString);
          setParsedQuiz(jsonQuiz);
        } catch (jsonErr) {
          console.error('Failed parsing quiz JSON:', jsonErr);
          setOutput("Error: The AI didn't format the quiz as clean JSON. Try again.");
        }
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setOutput(
        error.response?.data?.message ||
          'Failed to communicate with your backend engine.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (optionIndex) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);

    if (optionIndex === parsedQuiz[currentQuestionIndex].correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    if (currentQuestionIndex + 1 < parsedQuiz.length) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      setQuizComplete(true);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Smart Assistant</h2>
        <p className="sidebar__user">
          Hi, <strong>{username}</strong>
        </p>

        <nav>
          {['explain', 'summary', 'quiz', 'revision'].map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? 'active-nav-btn' : 'nav-btn'}
              onClick={() => setMode(m)}
            >
              {m.toUpperCase()} Mode
            </button>
          ))}
        </nav>

        <button type="button" className="sidebar__logout" onClick={onLogout}>
          Log out
        </button>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <h1>
            Active Mode: <span className="highlight">{mode.toUpperCase()}</span>
          </h1>
          <p>Provide your textbook text or subject notes to create custom learning materials.</p>
        </header>

        <div className="split-view">
          <form onSubmit={handleSubmit} className="input-panel">
            <div className="input-panel__toolbar">
              <label className="input-panel__label" htmlFor="study-material">
                Study material
              </label>
              <button
                type="button"
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <span className="attach-btn__icon" aria-hidden>
                  +
                </span>
                Add file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="input-panel__file-input"
                accept={ACCEPTED_FILE_TYPES}
                multiple
                onChange={handleFileUpload}
                tabIndex={-1}
              />
            </div>

            {attachedFiles.length > 0 && (
              <ul className="attached-files">
                {attachedFiles.map((file) => (
                  <li key={file.id} className="attached-files__item">
                    <span className="attached-files__name">{file.name}</span>
                    <button
                      type="button"
                      className="attached-files__remove"
                      onClick={() => removeAttachedFile(file.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {fileError && <p className="input-panel__file-error">{fileError}</p>}

            <div className="textarea-wrap">
              <textarea
                id="study-material"
                placeholder={`Paste your studying material here for ${mode} mode...`}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input-panel__actions">
              <button
                type="button"
                className="attach-btn attach-btn--secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Upload
              </button>
              <button type="submit" className="generate-btn" disabled={loading}>
                {loading ? 'Processing...' : `Generate ${mode.toUpperCase()}`}
              </button>
            </div>
          </form>

          <div className="output-panel">
            <h3>AI Generated Study Output</h3>
            {loading && (
              <div className="spinner">Analyzing notes and structuring response...</div>
            )}

            {!loading && output && (
              <div className="output-content">
                {mode === 'quiz' && parsedQuiz.length > 0 ? (
                  <div className="quiz-container">
                    {!quizComplete ? (
                      <div>
                        <span className="quiz-progress">
                          Question {currentQuestionIndex + 1} of {parsedQuiz.length}
                        </span>
                        <h4 className="quiz-question">
                          {parsedQuiz[currentQuestionIndex].question}
                        </h4>
                        <div className="options-list">
                          {parsedQuiz[currentQuestionIndex].options.map((option, idx) => {
                            let btnClass = 'option-btn';
                            if (selectedOption !== null) {
                              if (idx === parsedQuiz[currentQuestionIndex].correctIndex) {
                                btnClass += ' correct';
                              } else if (selectedOption === idx) {
                                btnClass += ' incorrect';
                              }
                            }
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={btnClass}
                                onClick={() => handleOptionClick(idx)}
                                disabled={selectedOption !== null}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {selectedOption !== null && (
                          <button type="button" className="next-btn" onClick={handleNextQuestion}>
                            {currentQuestionIndex + 1 === parsedQuiz.length
                              ? 'Finish Quiz'
                              : 'Next Question'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="quiz-results">
                        <h4>Quiz Complete!</h4>
                        <p>
                          Your Final Score:{' '}
                          <strong>
                            {score} / {parsedQuiz.length}
                          </strong>{' '}
                          ({Math.round((score / parsedQuiz.length) * 100)}%)
                        </p>
                        <button
                          type="button"
                          className="reset-quiz-btn"
                          onClick={() => handleSubmit({ preventDefault: () => {} })}
                        >
                          Retake Quiz
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
            {!loading && !output && (
              <p className="placeholder-text">
                Your study guides and structural materials will appear here.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
