export const AUTOPLAY_WINDOW_MS = 30_000;
export const TRACK_END_THRESHOLD_MS = 800;
export const PROGRESS_TICK_MS = 500;
export const AUTOPLAY_RETRY_MS = 2_000;
export const TRACK_CONFIRM_ATTEMPTS = 12;
export const TRACK_CONFIRM_DELAY_MS = 200;
export const RESUME_ATTEMPTS = 6;
export const RESUME_DELAY_MS = 200;

export const TRACK_CACHE_KEY = 'spotify_music_tracks';

export function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function normalizeTrack(track) {
  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    artist: track.artists.map((artist) => artist.name).join(', '),
    album: track.album.name,
    imageUrl: track.album.images[0]?.url || track.album.images.at(-1)?.url || '',
  };
}

export function pickDifferentTrack(tracks, currentTrackId) {
  if (!currentTrackId || tracks.length <= 1) {
    return normalizeTrack(tracks[Math.floor(Math.random() * tracks.length)]);
  }

  const alternatives = tracks.filter((track) => track.id !== currentTrackId);
  const pool = alternatives.length ? alternatives : tracks;
  return normalizeTrack(pool[Math.floor(Math.random() * pool.length)]);
}

export function readCachedTracks() {
  const raw = sessionStorage.getItem(TRACK_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(TRACK_CACHE_KEY);
    return null;
  }
}

export function writeCachedTracks(tracks) {
  sessionStorage.setItem(TRACK_CACHE_KEY, JSON.stringify(tracks));
}

let sdkPromise = null;
let sharedPlayer = null;
let sharedDeviceId = '';

export function getSharedPlayerState() {
  return { player: sharedPlayer, deviceId: sharedDeviceId };
}

export function setSharedPlayerState(player, deviceId) {
  sharedPlayer = player;
  sharedDeviceId = deviceId;
}

export function loadSpotifySdk() {
  if (window.Spotify) {
    return Promise.resolve(window.Spotify);
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-spotify-sdk="true"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.dataset.spotifySdk = 'true';
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error('Failed to load Spotify SDK'));
      };
      document.body.appendChild(script);
    }

    window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);
  });

  return sdkPromise;
}

export function getTrackFromState(state) {
  return state?.track_window?.current_track ?? null;
}

export function isNearTrackEnd(state) {
  return (
    state.duration > 0 &&
    state.duration - state.position <= TRACK_END_THRESHOLD_MS
  );
}

export function isTrackFinished(state) {
  if (!state || state.duration <= 0) {
    return false;
  }

  return state.duration - state.position <= TRACK_END_THRESHOLD_MS;
}

export function createPlaybackSession() {
  return { trackId: '', maxPosition: 0 };
}

export function resetPlaybackSession(session, trackId = '') {
  session.trackId = trackId;
  session.maxPosition = 0;
}

export function updatePlaybackSession(session, state, trackId) {
  if (!state || state.paused || !trackId) {
    return;
  }

  const track = getTrackFromState(state);
  if (track?.id !== trackId) {
    return;
  }

  session.trackId = trackId;
  session.maxPosition = Math.max(session.maxPosition, state.position);
}

/** Spotify often resets to 0:00 paused after a single-URI track ends. */
export function hasTrackLoopedToStart(state, session) {
  if (!state || state.duration <= 5000) {
    return false;
  }

  return (
    state.paused &&
    state.position < 1500 &&
    session.maxPosition >= state.duration - TRACK_END_THRESHOLD_MS * 3
  );
}

export function shouldAutoAdvance(state, runtime, session) {
  if (
    runtime.userPaused ||
    runtime.isChangingTrack ||
    runtime.isAdvancing ||
    runtime.isCommandBusy
  ) {
    return false;
  }

  if (!state) {
    return Boolean(runtime.currentTrackId);
  }

  return isTrackFinished(state) || hasTrackLoopedToStart(state, session);
}

export function shouldResumePlayback(state, runtime, session) {
  if (
    !state ||
    runtime.userPaused ||
    runtime.isChangingTrack ||
    runtime.isAdvancing ||
    runtime.isCommandBusy
  ) {
    return false;
  }

  if (isTrackFinished(state) || hasTrackLoopedToStart(state, session)) {
    return false;
  }

  return state.paused;
}

/** Serializes play/pause/shuffle so rapid clicks don't race the SDK. */
export function createPlaybackQueue(onBusyChange) {
  let chain = Promise.resolve();
  let busy = false;

  const setBusy = (next) => {
    busy = next;
    onBusyChange?.(next);
  };

  return {
    get isBusy() {
      return busy;
    },
    run(taskFn) {
      chain = chain
        .catch(() => {})
        .then(async () => {
          setBusy(true);
          try {
            await taskFn();
          } finally {
            setBusy(false);
          }
        });
      return chain;
    },
    /** Runs task once; extra calls while queued coalesce into a single follow-up run. */
    runCoalesced(taskFn, pendingRef) {
      pendingRef.current = true;
      return this.run(async () => {
        while (pendingRef.current) {
          pendingRef.current = false;
          await taskFn();
        }
      });
    },
  };
}
