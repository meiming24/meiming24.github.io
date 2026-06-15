import { useCallback, useEffect, useRef, useState } from 'react';
import { faviconForDomain } from '../utils/favicon';
import ShortcutIcon from './ShortcutIcon';

const MAX_SHORTCUTS = 10;

function ShortcutMenu({ app, isOpen, onToggle, onClose, onEdit, onRemove }) {
  const menuRef = useRef(null);
  const longPressRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onClose]);

  const handleTouchStart = useCallback(() => {
    longPressRef.current = window.setTimeout(() => {
      onToggle();
    }, 500);
  }, [onToggle]);

  const handleTouchEnd = useCallback(() => {
    window.clearTimeout(longPressRef.current);
  }, []);

  return (
    <div className={`app-item-menu${isOpen ? ' app-item-menu--open' : ''}`} ref={menuRef}>
      <button
        type="button"
        className="app-item-menu-trigger"
        aria-label={`Shortcut options for ${app.name}`}
        aria-expanded={isOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        ⋮
      </button>

      {isOpen ? (
        <div className="app-item-menu-dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
              onEdit(app);
            }}
          >
            Edit shortcut
          </button>
          <button
            type="button"
            role="menuitem"
            className="app-item-menu-remove"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
              onRemove(app.id);
            }}
          >
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function parseShortcutDraft(name, urlInput) {
  let url = urlInput.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const parsed = new URL(url);
  const domain = parsed.hostname.replace(/^www\./i, '');
  const baseUrl = `${parsed.protocol}//${parsed.hostname}/`;

  return {
    name: name.trim(),
    domain,
    baseUrl,
    queryUrl: baseUrl,
    img: faviconForDomain(domain),
  };
}

function ShortcutModal({ title, initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.baseUrl ?? '');

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim() || !url.trim()) {
      return;
    }

    try {
      onSave(parseShortcutDraft(name, url));
      onClose();
    } catch {
      // Invalid URL.
    }
  };

  return (
    <div className="shortcut-modal-backdrop" onClick={onClose}>
      <div
        className="shortcut-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="shortcut-modal-title" className="shortcut-modal-title">
          {title}
        </h2>

        <form className="shortcut-modal-form" onSubmit={handleSubmit}>
          <label className="shortcut-modal-field">
            <span className="shortcut-modal-label">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
          </label>

          <label className="shortcut-modal-field">
            <span className="shortcut-modal-label">URL</span>
            <input
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="example.com"
              required
            />
          </label>

          <div className="shortcut-modal-actions">
            <button type="button" className="shortcut-modal-button shortcut-modal-button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="shortcut-modal-button shortcut-modal-button--primary">
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AppList({
  shortcuts,
  onAppClick,
  onRemove,
  onAdd,
  onUpdate,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [modal, setModal] = useState(null);
  const iconLongPressRef = useRef(null);
  const didLongPressRef = useRef(false);

  const visibleShortcuts = shortcuts.slice(0, MAX_SHORTCUTS);

  const closeMenu = useCallback(() => {
    setMenuOpenId(null);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const openEditModal = useCallback((shortcut) => {
    setModal({ mode: 'edit', shortcut });
  }, []);

  return (
    <div className="app-container">
      <ul className="app-list">
        {visibleShortcuts.map((app) => (
          <li key={app.id} className={`app-item${menuOpenId === app.id ? ' app-item--menu-open' : ''}`}>
            <button
              type="button"
              className="app-item-link"
              onTouchStart={() => {
                didLongPressRef.current = false;
                iconLongPressRef.current = window.setTimeout(() => {
                  didLongPressRef.current = true;
                  setMenuOpenId((current) => (current === app.id ? null : app.id));
                }, 500);
              }}
              onTouchEnd={() => window.clearTimeout(iconLongPressRef.current)}
              onTouchMove={() => window.clearTimeout(iconLongPressRef.current)}
              onClick={(e) => {
                if (didLongPressRef.current) {
                  e.preventDefault();
                  return;
                }
                onAppClick(app);
              }}
            >
              <span className="app-item-icon-wrap">
                <ShortcutIcon key={app.domain} domain={app.domain} />
              </span>
              <span className="app-item-name">{app.name}</span>
            </button>

            <ShortcutMenu
              app={app}
              isOpen={menuOpenId === app.id}
              onToggle={() => setMenuOpenId((current) => (current === app.id ? null : app.id))}
              onClose={closeMenu}
              onEdit={openEditModal}
              onRemove={onRemove}
            />
          </li>
        ))}

        <li className="app-item app-item--add">
          <button
            type="button"
            className="app-item-link app-item-add-button"
            aria-label="Add shortcut"
            onClick={() => setModal({ mode: 'add' })}
          >
            <span className="app-item-icon-wrap" aria-hidden="true">
              <span className="app-item-add-plus" />
            </span>
            <span className="app-item-name">Add shortcut</span>
          </button>
        </li>
      </ul>

      {modal?.mode === 'add' ? (
        <ShortcutModal
          title="Add shortcut"
          onSave={onAdd}
          onClose={closeModal}
        />
      ) : null}

      {modal?.mode === 'edit' ? (
        <ShortcutModal
          title="Edit shortcut"
          initial={modal.shortcut}
          onSave={(draft) => onUpdate(modal.shortcut.id, draft)}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
