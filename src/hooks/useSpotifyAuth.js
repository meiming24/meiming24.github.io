import { useCallback, useEffect, useState } from 'react';
import { SPOTIFY_CONFIGURED } from '../data/spotifyConfig';
import {
  clearSpotifyAuthParamsFromUrl,
  completeSpotifyLogin,
  getSpotifyAccessToken,
  getSpotifyAuthCodeFromUrl,
} from '../utils/spotifyAuth';

export function useSpotifyAuth() {
  const [accessToken, setAccessToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!SPOTIFY_CONFIGURED) {
      setAuthLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function bootstrapAuth() {
      try {
        const authCode = getSpotifyAuthCodeFromUrl();
        if (authCode) {
          const token = await completeSpotifyLogin(authCode);
          clearSpotifyAuthParamsFromUrl();
          if (!cancelled) {
            setAccessToken(token);
          }
          return;
        }

        const token = await getSpotifyAccessToken();
        if (!cancelled) {
          setAccessToken(token);
        }
      } catch (error) {
        if (!cancelled) {
          clearSpotifyAuthParamsFromUrl();
          setAuthError(error.message || 'Spotify login failed');
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError('');
  }, []);

  return {
    accessToken,
    authLoading,
    authError,
    clearAuthError,
    isConfigured: SPOTIFY_CONFIGURED,
  };
}
