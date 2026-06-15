import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTodayInfo } from '../hooks/useTodayInfo';
import { useLiveClock } from '../hooks/useLiveClock';

const STORAGE_KEY = 'today-panel-open-v2';

function readStoredOpenState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return false;
    }
    return stored === 'true';
  } catch {
    return false;
  }
}

function TodayPanelContent({ holiday, headlines, loading, holidayError, headlinesError }) {
  return (
    <>
      <section className="today-panel-block" aria-label="Holiday">
        <span className="today-panel-label">Holiday</span>
        {loading ? (
          <p className="today-panel-line today-panel-line--loading">Loading…</p>
        ) : holidayError ? (
          <p className="today-panel-line today-panel-line--muted">Could not load holidays</p>
        ) : holiday ? (
          <p className="today-panel-line today-panel-line--holiday">{holiday}</p>
        ) : (
          <p className="today-panel-line today-panel-line--muted">No public holiday today</p>
        )}
      </section>

      <section className="today-panel-block" aria-label="Headlines">
        <span className="today-panel-label">In the news</span>
        {loading ? (
          <p className="today-panel-line today-panel-line--loading">Loading…</p>
        ) : headlinesError || !headlines.length ? (
          <p className="today-panel-line today-panel-line--muted">No headlines available</p>
        ) : (
          <ul className="today-panel-headlines">
            {headlines.map((headline) => (
              <li key={headline.url || headline.title}>
                <a
                  href={headline.url}
                  className="today-panel-headline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {headline.title}
                </a>
                {headline.source ? (
                  <span className="today-panel-source">{headline.source}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function TodayPanel() {
  const { dateLabel, holiday, headlines, loading, holidayError, headlinesError } =
    useTodayInfo();
  const { time, timeWithSeconds, timeZoneLabel } = useLiveClock();
  const [open, setOpen] = useState(readStoredOpenState);

  const shortDate = useMemo(() => {
    const today = new Date();
    return {
      day: today.getDate(),
      weekday: today.toLocaleDateString(undefined, { weekday: 'long' }),
      month: today.toLocaleDateString(undefined, { month: 'long' }),
      year: today.getFullYear(),
    };
  }, []);

  const hasHoliday = Boolean(holiday) && !loading && !holidayError;

  const toggle = useCallback(() => {
    setOpen((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        try {
          localStorage.setItem(STORAGE_KEY, 'false');
        } catch {
          // Ignore storage failures.
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div className={`today-panel-shell${open ? ' today-panel-shell--open' : ''}`}>
      <button
        type="button"
        className={`today-panel-tab${hasHoliday ? ' today-panel-tab--holiday' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="today-panel-content"
        aria-label={open ? 'Hide today' : 'Show today'}
      >
        <span className="today-panel-tab-glow" aria-hidden="true" />
        <span className="today-panel-tab-daybox" aria-hidden="true">
          <span className="today-panel-tab-day">{shortDate.day}</span>
        </span>
        <span className="today-panel-tab-divider" aria-hidden="true" />
        <span className="today-panel-tab-copy">
          <span className="today-panel-tab-weekday">{shortDate.weekday}</span>
          <span className="today-panel-tab-meta">
            <span className="today-panel-tab-month">{shortDate.month}</span>
            <span className="today-panel-tab-year">{shortDate.year}</span>
          </span>
          <span className="today-panel-tab-time">{time}</span>
        </span>
        <span className="today-panel-tab-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor" />
          </svg>
        </span>
      </button>

      <aside
        id="today-panel-content"
        className="today-panel"
        aria-label="Today"
        aria-hidden={!open}
      >
        <header className="today-panel-header">
          <div className="today-panel-header-copy">
            <p className="today-panel-date">{dateLabel}</p>
            <p className="today-panel-clock">
              {timeWithSeconds}
              {timeZoneLabel ? <span className="today-panel-clock-zone"> · {timeZoneLabel}</span> : null}
            </p>
          </div>
          <button
            type="button"
            className="today-panel-close"
            onClick={toggle}
            aria-label="Hide today"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor" />
            </svg>
          </button>
        </header>

        <div className="today-panel-body">
          <TodayPanelContent
            holiday={holiday}
            headlines={headlines}
            loading={loading}
            holidayError={holidayError}
            headlinesError={headlinesError}
          />
        </div>
      </aside>
    </div>
  );
}
