import { useCallback, useEffect, useState } from 'react';
import { fetchWeather } from '../utils/weather';

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadWeather = useCallback(async (force = false) => {
    if (force) {
      setLoading(true);
    }

    try {
      const result = await fetchWeather();
      setWeather(result);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const refresh = useCallback(
    (force = true) => loadWeather(force),
    [loadWeather],
  );

  return { weather, loading, error, refresh };
}
