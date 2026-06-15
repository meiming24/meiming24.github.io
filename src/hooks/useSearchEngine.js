import { useCallback, useState } from 'react';
import { DEFAULT_SEARCH_ENGINE_ID, getSearchEngine } from '../data/searchEngines';

const STORAGE_KEY = 'homepage-search-engine-v1';

function readStoredEngineId() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return getSearchEngine(stored).id;
  } catch {
    return DEFAULT_SEARCH_ENGINE_ID;
  }
}

export function useSearchEngine() {
  const [engineId, setEngineId] = useState(readStoredEngineId);
  const engine = getSearchEngine(engineId);

  const setEngine = useCallback((nextId) => {
    const nextEngine = getSearchEngine(nextId);
    setEngineId(nextEngine.id);
    try {
      localStorage.setItem(STORAGE_KEY, nextEngine.id);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const buildSearchUrl = useCallback(
    (query) => engine.buildUrl(query.trim()),
    [engine],
  );

  return {
    engine,
    engineId,
    setEngine,
    buildSearchUrl,
  };
}
