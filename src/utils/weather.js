import {
  DEFAULT_WEATHER_LAT,
  DEFAULT_WEATHER_LON,
  WEATHER_CITY,
} from '../data/appConfig';

const LOCATION_CACHE_KEY = 'weather-location-v2';
const CACHE_TTL_MS = 30 * 60 * 1000;

const TIMEZONE_FALLBACKS = {
  'Asia/Bangkok': { latitude: 21.0285, longitude: 105.8542, city: 'Hanoi' },
  'Asia/Ho_Chi_Minh': { latitude: 10.8231, longitude: 106.6297, city: 'Ho Chi Minh City' },
  'Asia/Saigon': { latitude: 10.8231, longitude: 106.6297, city: 'Ho Chi Minh City' },
  'America/New_York': { latitude: 40.7128, longitude: -74.006, city: 'New York' },
  'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles' },
  'Europe/London': { latitude: 51.5074, longitude: -0.1278, city: 'London' },
  'Asia/Tokyo': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo' },
  'Asia/Singapore': { latitude: 1.3521, longitude: 103.8198, city: 'Singapore' },
};

export function weatherCodeToEmoji(code, { isDay = true, cloudCover = 0 } = {}) {
  const night = !isDay;

  if (code === 0) {
    return night ? '🌙' : cloudCover >= 25 ? '🌤️' : '☀️';
  }

  if (code <= 2) {
    return night ? '☁️' : '⛅';
  }

  if (code === 3) {
    return '☁️';
  }

  if (code <= 48) {
    return '🌫️';
  }

  if (code <= 57) {
    return '🌦️';
  }

  if (code <= 67) {
    return '🌧️';
  }

  if (code <= 77) {
    return '🌨️';
  }

  if (code <= 82) {
    return '🌧️';
  }

  if (code <= 86) {
    return '🌨️';
  }

  if (code <= 99) {
    return '⛈️';
  }

  return '🌡️';
}

function readCachedLocation() {
  try {
    const raw = sessionStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw);
    if (Date.now() - cached.savedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }

    return cached;
  } catch {
    return null;
  }
}

function writeCachedLocation(location) {
  try {
    sessionStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({ ...location, savedAt: Date.now() }),
    );
  } catch {
    // Ignore storage failures.
  }
}

async function geocodeCity(cityName) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', cityName);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to geocode city');
  }

  const payload = await response.json();
  const place = payload.results?.[0];
  if (!place) {
    throw new Error(`City not found: ${cityName}`);
  }

  return {
    latitude: place.latitude,
    longitude: place.longitude,
    city: place.name,
    country: place.country || '',
    source: 'city',
  };
}

async function reverseGeocodeCity(latitude, longitude) {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('localityLanguage', 'en');

  const response = await fetch(url);
  if (!response.ok) {
    return '';
  }

  const payload = await response.json();
  return payload.city || payload.locality || payload.principalSubdivision || '';
}

function getTimezoneFallback() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fallback = TIMEZONE_FALLBACKS[timeZone];
  if (!fallback) {
    return null;
  }

  return { ...fallback, source: 'timezone' };
}

function getConfiguredCoordinates() {
  const hasExplicitLat = import.meta.env.VITE_WEATHER_LAT !== undefined;
  const hasExplicitLon = import.meta.env.VITE_WEATHER_LON !== undefined;

  if (!hasExplicitLat && !hasExplicitLon) {
    return null;
  }

  return {
    latitude: DEFAULT_WEATHER_LAT,
    longitude: DEFAULT_WEATHER_LON,
    city: WEATHER_CITY || 'Saved location',
    country: '',
    source: 'env',
  };
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 300_000,
      },
    );
  });
}

async function resolveWeatherLocation() {
  const cached = readCachedLocation();
  if (cached) {
    return cached;
  }

  if (WEATHER_CITY) {
    const cityLocation = await geocodeCity(WEATHER_CITY);
    writeCachedLocation(cityLocation);
    return cityLocation;
  }

  const configured = getConfiguredCoordinates();
  if (configured) {
    writeCachedLocation(configured);
    return configured;
  }

  try {
    const position = await getBrowserPosition();
    const city = await reverseGeocodeCity(position.latitude, position.longitude);
    const location = {
      ...position,
      city,
      country: '',
      source: 'gps',
    };
    writeCachedLocation(location);
    return location;
  } catch {
    const timezoneFallback = getTimezoneFallback();
    if (timezoneFallback) {
      writeCachedLocation(timezoneFallback);
      return timezoneFallback;
    }

    return {
      latitude: DEFAULT_WEATHER_LAT,
      longitude: DEFAULT_WEATHER_LON,
      city: 'New York',
      country: 'United States',
      source: 'default',
    };
  }
}

export async function fetchWeather() {
  const location = await resolveWeatherLocation();
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set(
    'current',
    'temperature_2m,weather_code,is_day,cloud_cover',
  );
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to load weather');
  }

  const payload = await response.json();
  const current = payload.current;
  if (!current) {
    throw new Error('Invalid weather response');
  }

  const isDay = current.is_day === 1;

  return {
    temperature: Math.round(current.temperature_2m),
    weatherCode: current.weather_code,
    isDay,
    cloudCover: current.cloud_cover ?? 0,
    emoji: weatherCodeToEmoji(current.weather_code, {
      isDay,
      cloudCover: current.cloud_cover ?? 0,
    }),
    city: location.city || payload.timezone?.split('/')?.at(-1)?.replace(/_/g, ' ') || '',
    source: location.source,
    timezone: payload.timezone || '',
  };
}

export function clearWeatherLocationCache() {
  try {
    sessionStorage.removeItem(LOCATION_CACHE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
