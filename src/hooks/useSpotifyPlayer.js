import { useCallback, useEffect, useRef, useState } from 'react';
import { SPOTIFY_ALBUM_ID, SPOTIFY_PLAYLIST_ID } from '../data/spotifyConfig';
import { fetchMusicTracks, startPlayback } from '../utils/spotifyApi';
import { getSpotifyAccessToken } from '../utils/spotifyAuth';
import {
  AUTOPLAY_RETRY_MS,
  AUTOPLAY_WINDOW_MS,
  createPlaybackQueue,
  createPlaybackSession,
  getSharedPlayerState,
  getTrackFromState,
  loadSpotifySdk,
  normalizeTrack,
  pickDifferentTrack,
  PROGRESS_TICK_MS,
  readCachedTracks,
  resetPlaybackSession,
  RESUME_ATTEMPTS,
  RESUME_DELAY_MS,
  setSharedPlayerState,
  shouldAutoAdvance,
  shouldResumePlayback,
  sleep,
  TRACK_CONFIRM_ATTEMPTS,
  TRACK_CONFIRM_DELAY_MS,
  updatePlaybackSession,
  writeCachedTracks,
} from '../utils/spotifyPlayerUtils';

function useLatestRef(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function useSpotifyPlayer(isAuthenticated) {
  const playerRef = useRef(null);
  const deviceIdRef = useRef('');
  const tracksRef = useRef(readCachedTracks() || []);
  const lastAdvancedFromTrackIdRef = useRef('');
  const playbackSessionRef = useRef(createPlaybackSession());
  const loadGenerationRef = useRef(0);
  const pendingShuffleRef = useRef(false);
  const advanceScheduledRef = useRef(false);
  const queueRef = useRef(null);
  const runtimeRef = useRef({
    currentTrackId: '',
    expectedTrackId: '',
    isSeeking: false,
    isChangingTrack: false,
    isAdvancing: false,
    isCommandBusy: false,
    userPaused: false,
    wasPlaying: false,
    autoplayUntil: 0,
  });

  const [status, setStatus] = useState('idle');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState({ position: 0, duration: 0 });

  if (!queueRef.current) {
    queueRef.current = createPlaybackQueue((busy) => {
      runtimeRef.current.isCommandBusy = busy;
      setIsBusy(busy);
    });
  }

  const getToken = useCallback(async () => {
    const token = await getSpotifyAccessToken();
    if (!token) {
      throw new Error('Spotify session expired');
    }
    return token;
  }, []);

  const applyPlayerState = useCallback((state) => {
    const sdkTrack = getTrackFromState(state);
    if (!sdkTrack) {
      return;
    }

    const track = normalizeTrack(sdkTrack);
    const runtime = runtimeRef.current;

    if (runtime.expectedTrackId && track.id !== runtime.expectedTrackId) {
      return;
    }

    if (runtime.currentTrackId !== track.id) {
      resetPlaybackSession(playbackSessionRef.current, track.id);
    }

    runtime.currentTrackId = track.id;
    runtime.wasPlaying = !state.paused;
    updatePlaybackSession(playbackSessionRef.current, state, track.id);
    setCurrentTrack(track);
    setIsPlaying(!state.paused);
    setStatus(state.paused ? 'paused' : 'playing');

    if (!runtime.isSeeking) {
      setProgress({ position: state.position, duration: state.duration });
    }
  }, []);

  const ensureTracks = useCallback(async () => {
    if (tracksRef.current.length) {
      return tracksRef.current;
    }

    const tracks = await fetchMusicTracks(await getToken(), {
      playlistId: SPOTIFY_PLAYLIST_ID,
      albumId: SPOTIFY_ALBUM_ID,
    });
    tracksRef.current = tracks;
    writeCachedTracks(tracks);
    return tracks;
  }, [getToken]);

  const resumePlayback = useCallback(async () => {
    const player = playerRef.current;
    if (!player) {
      return false;
    }

    try {
      await player.activateElement();
    } catch {
      // Browser may block audio until user interaction.
    }

    for (let attempt = 0; attempt < RESUME_ATTEMPTS; attempt += 1) {
      await player.resume();
      await sleep(RESUME_DELAY_MS);

      const state = await player.getCurrentState();
      if (state && !state.paused) {
        applyPlayerState(state);
        return true;
      }
    }

    return false;
  }, [applyPlayerState]);

  const playTrack = useCallback(
    async (nextTrack) => {
      const generation = loadGenerationRef.current + 1;
      loadGenerationRef.current = generation;

      const runtime = runtimeRef.current;
      runtime.isChangingTrack = true;
      runtime.expectedTrackId = nextTrack.id;
      runtime.userPaused = false;
      resetPlaybackSession(playbackSessionRef.current, nextTrack.id);
      setStatus('loading');
      setErrorMessage('');

      try {
        const deviceId = deviceIdRef.current || getSharedPlayerState().deviceId;
        if (!deviceId) {
          throw new Error('Spotify player is not ready yet');
        }

        runtime.currentTrackId = nextTrack.id;
        lastAdvancedFromTrackIdRef.current = '';
        setCurrentTrack(nextTrack);
        await startPlayback(await getToken(), deviceId, nextTrack.uri);

        for (let attempt = 0; attempt < TRACK_CONFIRM_ATTEMPTS; attempt += 1) {
          if (generation !== loadGenerationRef.current) {
            return;
          }

          await sleep(TRACK_CONFIRM_DELAY_MS);
          const state = await playerRef.current?.getCurrentState();
          if (getTrackFromState(state)?.id === nextTrack.id) {
            applyPlayerState(state);
            if (state.paused) {
              await resumePlayback();
            }
            return;
          }
        }

        if (generation !== loadGenerationRef.current) {
          return;
        }

        const started = await resumePlayback();
        if (!started) {
          runtime.wasPlaying = false;
          setIsPlaying(false);
          setStatus('paused');
        }
      } finally {
        if (generation === loadGenerationRef.current) {
          runtime.expectedTrackId = '';
          runtime.isChangingTrack = false;
        }
      }
    },
    [applyPlayerState, getToken, resumePlayback],
  );

  const playRandomTrackInternal = useCallback(async () => {
    try {
      const tracks = await ensureTracks();
      await playTrack(pickDifferentTrack(tracks, runtimeRef.current.currentTrackId));
    } catch (error) {
      lastAdvancedFromTrackIdRef.current = '';
      setStatus('error');
      setErrorMessage(error.message || 'Unable to play track');
    }
  }, [ensureTracks, playTrack]);

  const playRandomTrack = useCallback(() => {
    return queueRef.current.runCoalesced(playRandomTrackInternal, pendingShuffleRef);
  }, [playRandomTrackInternal]);

  const advanceToNextTrack = useCallback(async () => {
    const runtime = runtimeRef.current;
    if (runtime.isAdvancing) {
      return;
    }

    runtime.isAdvancing = true;
    runtime.wasPlaying = false;
    try {
      await playRandomTrackInternal();
    } finally {
      runtime.isAdvancing = false;
    }
  }, [playRandomTrackInternal]);

  const startAutoplay = useCallback(async () => {
    runtimeRef.current.autoplayUntil = Date.now() + AUTOPLAY_WINDOW_MS;

    const state = await playerRef.current?.getCurrentState();
    if (getTrackFromState(state) && !state.paused) {
      applyPlayerState(state);
      return;
    }

    await playRandomTrackInternal();
  }, [applyPlayerState, playRandomTrackInternal]);

  const actionsRef = useLatestRef({
    applyPlayerState,
    resumePlayback,
    startAutoplay,
    advanceToNextTrack,
    playRandomTrack,
    playRandomTrackInternal,
  });

  const tryAdvanceTrack = useCallback(() => {
    const runtime = runtimeRef.current;
    if (
      runtime.userPaused ||
      runtime.isChangingTrack ||
      runtime.isAdvancing ||
      runtime.isCommandBusy ||
      advanceScheduledRef.current
    ) {
      return;
    }

    const endedTrackId = runtime.currentTrackId;
    if (endedTrackId && lastAdvancedFromTrackIdRef.current === endedTrackId) {
      return;
    }

    if (endedTrackId) {
      lastAdvancedFromTrackIdRef.current = endedTrackId;
    }

    runtime.wasPlaying = false;
    advanceScheduledRef.current = true;

    queueRef.current
      .run(() => actionsRef.current.advanceToNextTrack())
      .finally(() => {
        advanceScheduledRef.current = false;
      });
  }, [actionsRef]);

  const handleTogglePlayback = useCallback(() => {
    return queueRef.current.run(async () => {
      const runtime = runtimeRef.current;
      const player = playerRef.current;
      if (!player) {
        return;
      }

      try {
        const state = await player.getCurrentState();
        const isPaused = !state || state.paused;

        if (!isPaused) {
          runtime.userPaused = true;
          runtime.wasPlaying = false;
          await player.pause();
          setIsPlaying(false);
          setStatus('paused');
          return;
        }

        runtime.userPaused = false;
        const resumed = await resumePlayback();
        if (!resumed && !runtime.currentTrackId) {
          await playRandomTrackInternal();
        }
      } catch (error) {
        setErrorMessage(error.message || 'Unable to update playback');
      }
    });
  }, [playRandomTrackInternal, resumePlayback]);

  const seekTo = useCallback(async (positionMs) => {
    if (!playerRef.current || runtimeRef.current.isCommandBusy) {
      return;
    }

    await playerRef.current.seek(positionMs);
    setProgress((current) => ({ ...current, position: positionMs }));
  }, []);

  const beginSeek = useCallback(() => {
    runtimeRef.current.isSeeking = true;
  }, []);

  const endSeek = useCallback(
    async (positionMs) => {
      runtimeRef.current.isSeeking = false;
      if (runtimeRef.current.isCommandBusy) {
        return;
      }
      await seekTo(positionMs);
    },
    [seekTo],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const runtime = runtimeRef.current;
    runtime.autoplayUntil = Date.now() + AUTOPLAY_WINDOW_MS;

    const tryResumeIfNeeded = async () => {
      if (runtime.userPaused || runtime.isChangingTrack || runtime.isCommandBusy) {
        return;
      }

      const state = await playerRef.current?.getCurrentState();
      const session = playbackSessionRef.current;

      if (shouldAutoAdvance(state, runtime, session)) {
        tryAdvanceTrack();
        return;
      }

      if (state && !state.paused) {
        return;
      }

      if (!runtime.currentTrackId) {
        if (Date.now() <= runtime.autoplayUntil) {
          queueRef.current.run(() => actionsRef.current.startAutoplay());
        }
        return;
      }

      if (
        Date.now() <= runtime.autoplayUntil &&
        shouldResumePlayback(state, runtime, session)
      ) {
        queueRef.current.run(() => actionsRef.current.resumePlayback());
      }
    };

    const unlockOnInteraction = () => {
      tryResumeIfNeeded();
    };

    const handlePageShow = () => {
      runtime.autoplayUntil = Date.now() + AUTOPLAY_WINDOW_MS;
      runtime.userPaused = false;
      queueRef.current.run(() => actionsRef.current.startAutoplay());
    };

    const retryTimer = window.setInterval(tryResumeIfNeeded, AUTOPLAY_RETRY_MS);
    const progressTimer = window.setInterval(async () => {
      const player = playerRef.current;
      if (!player || runtime.isSeeking || runtime.isCommandBusy) {
        return;
      }

      const state = await player.getCurrentState();
      if (!state) {
        if (runtime.currentTrackId && !runtime.userPaused) {
          tryAdvanceTrack();
        }
        return;
      }

      if (!runtime.isSeeking) {
        setProgress({ position: state.position, duration: state.duration });
      }

      updatePlaybackSession(playbackSessionRef.current, state, runtime.currentTrackId);

      if (shouldAutoAdvance(state, runtime, playbackSessionRef.current)) {
        tryAdvanceTrack();
      }
    }, PROGRESS_TICK_MS);

    window.addEventListener('pointerdown', unlockOnInteraction, { once: true });
    window.addEventListener('keydown', unlockOnInteraction, { once: true });
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.clearInterval(retryTimer);
      window.clearInterval(progressTimer);
      window.removeEventListener('pointerdown', unlockOnInteraction);
      window.removeEventListener('keydown', unlockOnInteraction);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [actionsRef, isAuthenticated, tryAdvanceTrack]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let cancelled = false;

    const attachPlayerListeners = (player) => {
      player.addListener('ready', ({ device_id: deviceId }) => {
        deviceIdRef.current = deviceId;
        setSharedPlayerState(player, deviceId);
        if (!cancelled) {
          queueRef.current.run(() => actionsRef.current.startAutoplay());
        }
      });

      player.addListener('player_state_changed', (state) => {
        const runtime = runtimeRef.current;
        if (runtime.isChangingTrack) {
          return;
        }

        if (!state) {
          if (runtime.currentTrackId && !runtime.userPaused) {
            tryAdvanceTrack();
          }
          return;
        }

        actionsRef.current.applyPlayerState(state);

        if (shouldAutoAdvance(state, runtime, playbackSessionRef.current)) {
          tryAdvanceTrack();
        }
      });

      player.addListener('autoplay_failed', () => {
        runtimeRef.current.wasPlaying = false;
        setStatus('paused');
        setIsPlaying(false);
      });

      player.addListener('authentication_error', () => {
        setStatus('error');
        setErrorMessage('Spotify authentication failed');
      });

      player.addListener('account_error', () => {
        setStatus('error');
        setErrorMessage('Spotify Premium is required for playback');
      });

      player.addListener('initialization_error', () => {
        setStatus('error');
        setErrorMessage('Spotify player failed to initialize');
      });
    };

    async function setupPlayer() {
      setStatus('connecting');

      try {
        await getToken();
        if (cancelled) {
          return;
        }

        const shared = getSharedPlayerState();
        if (shared.player) {
          playerRef.current = shared.player;
          deviceIdRef.current = shared.deviceId;

          const state = await shared.player.getCurrentState();
          if (state) {
            applyPlayerState(state);
          }
          await queueRef.current.run(() => actionsRef.current.startAutoplay());
          return;
        }

        await loadSpotifySdk();
        if (cancelled) {
          return;
        }

        const player = new window.Spotify.Player({
          name: 'Custom Google UI Player',
          getOAuthToken: (callback) => {
            getToken().then(callback).catch(() => callback(''));
          },
          volume: 0.8,
        });

        attachPlayerListeners(player);
        playerRef.current = player;
        setSharedPlayerState(player, deviceIdRef.current);
        await player.connect();
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(error.message || 'Unable to connect Spotify player');
        }
      }
    }

    setupPlayer();

    return () => {
      cancelled = true;
    };
  }, [
    actionsRef,
    applyPlayerState,
    getToken,
    isAuthenticated,
    tryAdvanceTrack,
  ]);

  return {
    status,
    currentTrack,
    isPlaying,
    isBusy,
    errorMessage,
    progress,
    playRandomTrack,
    togglePlayback: handleTogglePlayback,
    beginSeek,
    endSeek,
  };
}
