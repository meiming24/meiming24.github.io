import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
} from '../data/spotifyConfig';

const TOKEN_STORAGE_KEY = 'spotify_token_bundle';
const VERIFIER_STORAGE_KEY = 'spotify_code_verifier';

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createRandomString(length = 64) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(values, (value) => possible[value % possible.length]).join('');
}

async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

function readTokenBundle() {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

function writeTokenBundle(bundle) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(bundle));
}

async function exchangeToken(body) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Spotify token');
  }

  const payload = await response.json();
  const expiresAt = Date.now() + payload.expires_in * 1000 - 60_000;

  const existing = readTokenBundle();
  const bundle = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || existing?.refreshToken || '',
    expiresAt,
  };

  writeTokenBundle(bundle);
  return bundle.accessToken;
}

export async function beginSpotifyLogin() {
  const verifier = createRandomString();
  const challenge = await createCodeChallenge(verifier);
  localStorage.setItem(VERIFIER_STORAGE_KEY, verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.assign(`https://accounts.spotify.com/authorize?${params.toString()}`);
}

export async function completeSpotifyLogin(code) {
  const verifier = localStorage.getItem(VERIFIER_STORAGE_KEY);
  localStorage.removeItem(VERIFIER_STORAGE_KEY);

  if (!verifier) {
    throw new Error('Login expired — click Connect to try again');
  }

  return exchangeToken({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_verifier: verifier,
  });
}

export async function getSpotifyAccessToken() {
  const bundle = readTokenBundle();
  if (!bundle?.accessToken) {
    return null;
  }

  if (Date.now() < bundle.expiresAt) {
    return bundle.accessToken;
  }

  if (!bundle.refreshToken) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }

  return exchangeToken({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: bundle.refreshToken,
  });
}

export function clearSpotifySession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(VERIFIER_STORAGE_KEY);
}

export function getSpotifyAuthCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    throw new Error(error);
  }

  return code;
}

export function clearSpotifyAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}
