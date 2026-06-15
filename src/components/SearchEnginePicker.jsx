import { useEffect, useRef, useState } from 'react';
import { SEARCH_ENGINES } from '../data/searchEngines';

function DuckDuckGoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#DE5833" />
      <ellipse cx="12" cy="13.5" rx="7" ry="6.5" fill="#fff" />
      <circle cx="9.4" cy="11.5" r="1.1" fill="#2E2E2E" />
      <circle cx="14.6" cy="11.5" r="1.1" fill="#2E2E2E" />
      <path d="M10 15.2c.8.7 2.2.7 3 0" stroke="#2E2E2E" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function EngineIcon({ engine }) {
  if (engine.id === 'duckduckgo') {
    return <DuckDuckGoIcon />;
  }

  return <img src={engine.icon} alt="" />;
}

export default function SearchEnginePicker({ engine, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="search-engine-picker" ref={rootRef}>
      <button
        type="button"
        className="search-engine-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Search engine: ${engine.name}`}
      >
        <EngineIcon engine={engine} />
      </button>

      {open ? (
        <div className="search-engine-menu" role="listbox" aria-label="Choose search engine">
          {SEARCH_ENGINES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === engine.id}
              className={`search-engine-option${option.id === engine.id ? ' search-engine-option--active' : ''}`}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              <span className="search-engine-option-icon">
                <EngineIcon engine={option} />
              </span>
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
