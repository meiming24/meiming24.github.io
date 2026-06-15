import { useCallback, useState } from 'react';
import { useWeather } from '../hooks/useWeather';
import { clearWeatherLocationCache } from '../utils/weather';

export default function WeatherWidget() {
  const { weather, loading, error, refresh } = useWeather();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    clearWeatherLocationCache();
    await refresh(true);
    setRefreshing(false);
  }, [refresh]);

  return (
    <button
      type="button"
      className="weather-widget"
      aria-label="Current weather. Click to refresh location."
      onClick={handleRefresh}
      disabled={loading || refreshing}
      title={weather?.city ? `Weather for ${weather.city}. Click to refresh.` : 'Refresh weather'}
    >
      {loading || refreshing ? (
        <span className="weather-widget-line weather-widget-line--muted">Weather…</span>
      ) : error || !weather ? (
        <span className="weather-widget-line weather-widget-line--muted">Weather unavailable</span>
      ) : (
        <>
          <span className="weather-widget-icon" aria-hidden="true">
            {weather.emoji}
          </span>
          <span className="weather-widget-copy">
            <span className="weather-widget-temp">{weather.temperature}°</span>
            {weather.city ? (
              <span className="weather-widget-city">{weather.city}</span>
            ) : null}
          </span>
        </>
      )}
    </button>
  );
}
