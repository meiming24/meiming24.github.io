import { useCallback, useState } from 'react';
import { DEFAULT_SHORTCUTS } from '../data/defaultShortcuts';
import { faviconForDomain } from '../utils/favicon';

const STORAGE_KEY = 'homepage-shortcuts-v2';

function createShortcutId(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${slug || 'shortcut'}-${Date.now().toString(36)}`;
}

function resolveDomain(shortcut) {
  const candidates = [shortcut.baseUrl, shortcut.queryUrl, shortcut.domain];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) {
      continue;
    }

    try {
      const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      return new URL(url).hostname.replace(/^www\./i, '');
    } catch {
      if (!value.includes('/') && value.includes('.')) {
        return value.replace(/^www\./i, '');
      }
    }
  }

  return '';
}

function normalizeShortcut(shortcut) {
  const baseUrl = shortcut.baseUrl?.trim() || shortcut.queryUrl?.trim() || '';
  const domain = resolveDomain(shortcut);
  const normalizedBaseUrl = baseUrl || (domain ? `https://${domain}/` : '');

  return {
    id: shortcut.id || createShortcutId(shortcut.name || domain || 'site'),
    name: shortcut.name?.trim() || domain,
    domain,
    img: faviconForDomain(domain),
    queryUrl: shortcut.queryUrl?.trim() || normalizedBaseUrl,
    baseUrl: normalizedBaseUrl,
  };
}

function readStoredShortcuts() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      raw = localStorage.getItem('homepage-shortcuts-v1');
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem('homepage-shortcuts-v1');
      }
    }

    if (!raw) {
      return DEFAULT_SHORTCUTS.map(normalizeShortcut);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return DEFAULT_SHORTCUTS.map(normalizeShortcut);
    }

    return parsed.map(normalizeShortcut);
  } catch {
    return DEFAULT_SHORTCUTS.map(normalizeShortcut);
  }
}

function persistShortcuts(shortcuts) {
  try {
    const payload = shortcuts.map(({ id, name, domain, baseUrl, queryUrl }) => ({
      id,
      name,
      domain,
      baseUrl,
      queryUrl,
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState(readStoredShortcuts);

  const saveShortcuts = useCallback((updater) => {
    setShortcuts((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      persistShortcuts(next);
      return next;
    });
  }, []);

  const reorderShortcuts = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) {
        return;
      }

      saveShortcuts((current) => {
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [saveShortcuts],
  );

  const removeShortcut = useCallback(
    (id) => {
      saveShortcuts((current) => current.filter((shortcut) => shortcut.id !== id));
    },
    [saveShortcuts],
  );

  const addShortcut = useCallback(
    (draft) => {
      const shortcut = normalizeShortcut(draft);
      saveShortcuts((current) => [...current, shortcut]);
      return shortcut;
    },
    [saveShortcuts],
  );

  const updateShortcut = useCallback(
    (id, draft) => {
      saveShortcuts((current) =>
        current.map((shortcut) =>
          shortcut.id === id ? normalizeShortcut({ ...draft, id }) : shortcut,
        ),
      );
    },
    [saveShortcuts],
  );

  const resetShortcuts = useCallback(() => {
    saveShortcuts(DEFAULT_SHORTCUTS.map(normalizeShortcut));
  }, [saveShortcuts]);

  return {
    shortcuts,
    reorderShortcuts,
    removeShortcut,
    addShortcut,
    updateShortcut,
    resetShortcuts,
  };
}

export { faviconForDomain } from '../utils/favicon';
export { normalizeShortcut, resolveDomain };
