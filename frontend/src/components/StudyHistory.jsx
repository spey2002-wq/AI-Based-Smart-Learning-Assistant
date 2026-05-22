import { useEffect, useState } from 'react';
import { fetchStudyHistory } from '../api/auth';

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StudyHistory({ onSelectItem, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const history = await fetchStudyHistory();
        if (!cancelled) setItems(history);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load history');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section className="study-history">
      <button
        type="button"
        className="study-history__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>Saved Study History</span>
        <span className="study-history__chevron">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="study-history__body">
          <p className="study-history__note">Summaries & explanations you generated</p>

          {loading && <p className="study-history__status">Loading…</p>}
          {error && <p className="study-history__error">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p className="study-history__empty">No saved sessions yet. Generate while signed in.</p>
          )}

          <ul className="study-history__list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="study-history__item"
                  onClick={() => onSelectItem(item)}
                >
                  <span className={`study-history__mode study-history__mode--${item.mode}`}>
                    {item.mode}
                  </span>
                  <span className="study-history__preview">{item.preview}</span>
                  <span className="study-history__date">{formatDate(item.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
