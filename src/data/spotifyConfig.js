function resolveRedirectUri() {
  if (import.meta.env.VITE_SPOTIFY_REDIRECT_URI) {
    return import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  }

  // Spotify no longer accepts "localhost" — use the loopback IP instead.
  return window.location.origin.replace('localhost', '127.0.0.1');
}

export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
export const SPOTIFY_PLAYLIST_ID = import.meta.env.VITE_SPOTIFY_PLAYLIST_ID || '';
export const SPOTIFY_ALBUM_ID = import.meta.env.VITE_SPOTIFY_ALBUM_ID || '';
export const SPOTIFY_REDIRECT_URI = resolveRedirectUri();

export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

export const SPOTIFY_CONFIGURED = Boolean(
  SPOTIFY_CLIENT_ID && (SPOTIFY_PLAYLIST_ID || SPOTIFY_ALBUM_ID),
);
