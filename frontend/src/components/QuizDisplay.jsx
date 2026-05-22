import { useMemo, useState } from 'react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function getCorrectIndex(item) {
  return typeof item.correctIndex === 'number' ? item.correctIndex : item.correct;
}

export default function QuizDisplay({ quiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const normalizedQuiz = useMemo(
    () =>
      (quiz || []).map((item) => ({
        question: item.question,
        options: item.options,
        correctIndex: getCorrectIndex(item),
      })),
    [quiz]
  );

  if (!normalizedQuiz.length) {
    return <p className="interactive-quiz__error">No quiz questions available.</p>;
  }

  const total = normalizedQuiz.length;
  const score = Object.values(answers).filter((a) => a.isCorrect).length;
  const isComplete = Object.keys(answers).length === total;
  const current = normalizedQuiz[currentIndex];
  const currentAnswer = answers[currentIndex];
  const hasAnsweredCurrent = currentAnswer !== undefined;

  function handleOptionClick(optionIndex) {
    if (hasAnsweredCurrent) return;

    const isCorrect = optionIndex === current.correctIndex;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { selected: optionIndex, isCorrect },
    }));
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setAnswers({});
  }

  function getOptionClass(optionIndex) {
    if (!hasAnsweredCurrent) return '';

    const { correctIndex } = current;
    const { selected, isCorrect } = currentAnswer;

    if (optionIndex === correctIndex) return 'interactive-quiz__option--correct';
    if (optionIndex === selected && !isCorrect) return 'interactive-quiz__option--wrong';
    return 'interactive-quiz__option--muted';
  }

  if (isComplete) {
    const percent = Math.round((score / total) * 100);
    return (
      <div className="interactive-quiz interactive-quiz--complete">
        <div className="interactive-quiz__completion">
          <p className="interactive-quiz__completion-label">Quiz complete</p>
          <p className="interactive-quiz__completion-score">
            {score} / {total}
          </p>
          <p className="interactive-quiz__completion-percent">{percent}%</p>
          <p className="interactive-quiz__completion-message">
            {score === total
              ? 'Perfect score — outstanding work!'
              : score >= total / 2
                ? 'Good job — review any missed questions in your notes.'
                : 'Keep practicing — generate another quiz when you are ready.'}
          </p>
          <button type="button" className="interactive-quiz__restart" onClick={handleRestart}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interactive-quiz">
      <div className="interactive-quiz__header">
        <span className="interactive-quiz__counter">
          Question {currentIndex + 1} of {total}
        </span>
        <span className="interactive-quiz__live-score">
          Score: {score} / {total}
        </span>
      </div>

      <div className="interactive-quiz__progress-bar">
        <div
          className="interactive-quiz__progress-fill"
          style={{ width: `${(Object.keys(answers).length / total) * 100}%` }}
        />
      </div>

      <article className="interactive-quiz__card">
        <h4 className="interactive-quiz__question">{current.question}</h4>

        <div className="interactive-quiz__options">
          {current.options.map((option, oIndex) => (
            <button
              key={oIndex}
              type="button"
              className={`interactive-quiz__option ${currentAnswer?.selected === oIndex ? 'interactive-quiz__option--picked' : ''} ${getOptionClass(oIndex)}`}
              onClick={() => handleOptionClick(oIndex)}
              disabled={hasAnsweredCurrent}
            >
              <span className="interactive-quiz__option-letter">{OPTION_LABELS[oIndex]}</span>
              <span className="interactive-quiz__option-text">{option}</span>
              {hasAnsweredCurrent && oIndex === current.correctIndex && (
                <span className="interactive-quiz__badge interactive-quiz__badge--ok">✓</span>
              )}
              {hasAnsweredCurrent &&
                oIndex === currentAnswer.selected &&
                !currentAnswer.isCorrect && (
                  <span className="interactive-quiz__badge interactive-quiz__badge--bad">✗</span>
                )}
            </button>
          ))}
        </div>

        {hasAnsweredCurrent && (
          <p
            className={`interactive-quiz__feedback ${currentAnswer.isCorrect ? 'interactive-quiz__feedback--ok' : 'interactive-quiz__feedback--bad'}`}
          >
            {currentAnswer.isCorrect
              ? 'Correct!'
              : `Incorrect — the right answer is ${OPTION_LABELS[current.correctIndex]}.`}
          </p>
        )}

        {hasAnsweredCurrent && !isLastQuestion && (
          <button type="button" className="interactive-quiz__next" onClick={handleNext}>
            Next question →
          </button>
        )}
      </article>
    </div>
  );
}
