import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { beginSpotifyLogin } from '../utils/spotifyAuth';
import TrackMarquee, { formatTrackLine } from './TrackMarquee';

const EXPAND_DELAY_MS = 280;
const COLLAPSE_DELAY_MS = 420;

function formatTime(ms) {
  if (!ms || ms < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function PlayerControls({ isPlaying, onTogglePlayback, onShuffle, disabled = false, size = 'default' }) {
  return (
    <div className={`spotify-player-controls${size === 'mini' ? ' spotify-player-controls--dock' : ''}`}>
      <button
        type="button"
        className={`spotify-player-control${isPlaying ? ' spotify-player-control--active' : ''}`}
        onClick={onTogglePlayback}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5h3v14H8V5zm5 0h3v14h-3V5z" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="spotify-player-control"
        onClick={onShuffle}
        disabled={disabled}
        aria-label="Play another random song"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

function ProgressBar({ progress, onBeginSeek, onEndSeek }) {
  const trackRef = useRef(null);
  const [seekValue, setSeekValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setSeekValue(progress.position);
    }
  }, [isDragging, progress.position]);

  if (!progress.duration) {
    return null;
  }

  const percent = Math.min(100, (seekValue / progress.duration) * 100);

  const seekFromClientX = (clientX) => {
    const track = trackRef.current;
    if (!track) {
      return seekValue;
    }

    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * progress.duration);
  };

  return (
    <div className="spotify-player-progress">
      <div
        ref={trackRef}
        className="spotify-player-seek-track"
        role="slider"
        aria-label="Seek track position"
        aria-valuemin={0}
        aria-valuemax={progress.duration}
        aria-valuenow={seekValue}
        tabIndex={0}
        onPointerDown={(event) => {
          setIsDragging(true);
          onBeginSeek();
          setSeekValue(seekFromClientX(event.clientX));
        }}
        onPointerMove={(event) => {
          if (isDragging) {
            setSeekValue(seekFromClientX(event.clientX));
          }
        }}
        onPointerUp={(event) => {
          if (!isDragging) {
            return;
          }

          const nextValue = seekFromClientX(event.clientX);
          setIsDragging(false);
          setSeekValue(nextValue);
          onEndSeek(nextValue);
        }}
        onPointerLeave={(event) => {
          if (!isDragging) {
            return;
          }

          const nextValue = seekFromClientX(event.clientX);
          setIsDragging(false);
          setSeekValue(nextValue);
          onEndSeek(nextValue);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            onBeginSeek();
            const nextValue = Math.min(progress.duration, seekValue + 5000);
            setSeekValue(nextValue);
            onEndSeek(nextValue);
          }

          if (event.key === 'ArrowLeft') {
            onBeginSeek();
            const nextValue = Math.max(0, seekValue - 5000);
            setSeekValue(nextValue);
            onEndSeek(nextValue);
          }
        }}
      >
        <div className="spotify-player-seek-rail" />
        <div className="spotify-player-seek-fill" style={{ width: `${percent}%` }} />
        <div className="spotify-player-seek-thumb" style={{ left: `${percent}%` }} />
      </div>
      <div className="spotify-player-times">
        <span>{formatTime(seekValue)}</span>
        <span>{formatTime(progress.duration)}</span>
      </div>
    </div>
  );
}

function PinButton({ pinned, onClick }) {
  return (
    <button
      type="button"
      className={`spotify-player-pin${pinned ? ' spotify-player-pin--active' : ''}`}
      onClick={onClick}
      aria-label={pinned ? 'Unpin and minimize' : 'Pin player open'}
      aria-pressed={pinned}
    >
      <span className="spotify-player-pin-glow" aria-hidden="true" />
      <svg className="spotify-player-pin-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M16 3v4.586l1.707 1.707a1 1 0 0 1 .293.707V11l-4.5 2.25V20l-2 1v1h6v-1l-2-1v-6.75L11 11V9.293a1 1 0 0 1 .293-.707L13 7V3h3z"
          fill="currentColor"
        />
      </svg>
      <span className="spotify-player-pin-label">{pinned ? 'Pinned' : 'Pin'}</span>
    </button>
  );
}

function AlbumThumb({ track, isPlaying, loading = false }) {
  return (
    <div className={`spotify-player-thumb${isPlaying ? ' spotify-player-thumb--playing' : ''}${loading ? ' spotify-player-thumb--loading' : ''}`}>
      {track?.imageUrl ? (
        <img className="spotify-player-thumb-image" src={track.imageUrl} alt="" />
      ) : (
        <div className="spotify-player-thumb-image spotify-player-thumb-image--placeholder" aria-hidden="true" />
      )}
      {isPlaying ? (
        <span className="spotify-player-thumb-eq" aria-hidden="true">
          <span /><span /><span />
        </span>
      ) : null}
    </div>
  );
}

function usePlayerView() {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const expandTimerRef = useRef(null);
  const collapseTimerRef = useRef(null);

  const showCard = hoverOpen || pinned;

  const clearExpandTimer = useCallback(() => {
    window.clearTimeout(expandTimerRef.current);
  }, []);

  const clearCollapseTimer = useCallback(() => {
    window.clearTimeout(collapseTimerRef.current);
  }, []);

  const scheduleExpand = useCallback(() => {
    clearCollapseTimer();
    clearExpandTimer();
    expandTimerRef.current = window.setTimeout(() => {
      setHoverOpen(true);
    }, EXPAND_DELAY_MS);
  }, [clearCollapseTimer, clearExpandTimer]);

  const cancelExpand = useCallback(() => {
    clearExpandTimer();
  }, [clearExpandTimer]);

  const scheduleCollapse = useCallback(() => {
    if (pinned) {
      return;
    }

    clearExpandTimer();
    clearCollapseTimer();
    collapseTimerRef.current = window.setTimeout(() => {
      setHoverOpen(false);
    }, COLLAPSE_DELAY_MS);
  }, [clearCollapseTimer, clearExpandTimer, pinned]);

  const cancelCollapse = useCallback(() => {
    clearCollapseTimer();
  }, [clearCollapseTimer]);

  const togglePin = useCallback(() => {
    setPinned((current) => {
      const next = !current;
      if (next) {
        clearCollapseTimer();
        clearExpandTimer();
        setHoverOpen(true);
      } else {
        setHoverOpen(false);
      }
      return next;
    });
  }, [clearCollapseTimer, clearExpandTimer]);

  useEffect(
    () => () => {
      clearExpandTimer();
      clearCollapseTimer();
    },
    [clearCollapseTimer, clearExpandTimer],
  );

  return {
    showCard,
    pinned,
    scheduleExpand,
    cancelExpand,
    scheduleCollapse,
    cancelCollapse,
    togglePin,
  };
}

export default function SpotifyPlayer() {
  const { accessToken, authLoading, authError, clearAuthError, isConfigured } = useSpotifyAuth();
  const {
    status,
    currentTrack,
    isPlaying,
    isBusy,
    errorMessage,
    progress,
    playRandomTrack,
    togglePlayback,
    beginSeek,
    endSeek,
  } = useSpotifyPlayer(Boolean(accessToken));

  const {
    showCard,
    pinned,
    scheduleExpand,
    cancelExpand,
    scheduleCollapse,
    cancelCollapse,
    togglePin,
  } = usePlayerView();

  const handleConnect = useCallback(async () => {
    clearAuthError();
    await beginSpotifyLogin();
  }, [clearAuthError]);

  const shellProps = {
    onMouseEnter: cancelCollapse,
    onMouseLeave: scheduleCollapse,
  };

  if (!isConfigured) {
    return (
      <div className="spotify-player-shell spotify-player-shell--static">
        <div className="spotify-player-dock-row">
          <div className="spotify-player-dock spotify-player-dock--static">
            <span className="spotify-player-mini-icon" aria-hidden="true">♪</span>
            <TrackMarquee text="Add Spotify credentials in .env" className="spotify-marquee--dock" />
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || status === 'connecting' || (status === 'loading' && !currentTrack)) {
    const loadingText =
      authLoading || status === 'connecting' ? 'Connecting to Spotify...' : 'Shuffling the deck...';

    return (
      <div className="spotify-player-shell spotify-player-shell--static">
        <div className="spotify-player-dock-row">
          <div className="spotify-player-dock spotify-player-dock--static">
            <span className="spotify-player-mini-eq" aria-hidden="true">
              <span /><span /><span />
            </span>
            <TrackMarquee text={loadingText} className="spotify-marquee--dock" />
          </div>
        </div>
      </div>
    );
  }

  const tickerText =
    status === 'loading'
      ? 'Shuffling the deck...'
      : formatTrackLine(currentTrack, errorMessage || 'Loading track...');

  const controlsDisabled = isBusy || status === 'loading';

  if (!accessToken) {
    return (
      <div
        className={`spotify-player-shell${showCard ? ' spotify-player-shell--card' : ' spotify-player-shell--pill'}`}
        {...shellProps}
      >
        {showCard ? (
          <div className="spotify-player-card">
            <PinButton pinned={pinned} onClick={togglePin} />
            <div className="spotify-player-art spotify-player-art--placeholder spotify-player-art--logo">
              <img className="spotify-player-logo" src="/icons/spotify.png" alt="" />
            </div>
            <div className="spotify-player-body">
              <p className="spotify-player-label">Spotify</p>
              <p className="spotify-player-meta">{authError || 'Connect to shuffle your album'}</p>
              <button type="button" className="spotify-player-connect" onClick={handleConnect}>
                Connect
              </button>
            </div>
          </div>
        ) : (
          <div className="spotify-player-dock-row">
            <div
              className="spotify-player-dock spotify-player-dock--static spotify-player-dock-expand"
              onMouseEnter={scheduleExpand}
            >
              <img className="spotify-player-mini-logo" src="/icons/spotify.png" alt="" />
              <TrackMarquee text={authError || 'Connect to shuffle your album'} className="spotify-marquee--dock" />
            </div>
            <button type="button" className="spotify-player-connect spotify-player-connect--dock" onClick={handleConnect}>
              Connect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`spotify-player-shell${showCard ? ' spotify-player-shell--card' : ' spotify-player-shell--pill'}${pinned ? ' spotify-player-shell--pinned' : ''}`}
      {...shellProps}
    >
      {showCard ? (
        <div className="spotify-player-card">
          <PinButton pinned={pinned} onClick={togglePin} />

          {currentTrack?.imageUrl ? (
            <img className="spotify-player-art" src={currentTrack.imageUrl} alt={currentTrack.album} />
          ) : (
            <div className="spotify-player-art spotify-player-art--placeholder" aria-hidden="true" />
          )}

          <div className="spotify-player-body">
            <div className="spotify-player-copy">
              <p className="spotify-player-label">Now playing</p>
              <p className="spotify-player-track">{currentTrack?.name || 'Loading track...'}</p>
              <p className="spotify-player-meta">{currentTrack?.artist || errorMessage || 'Spotify'}</p>
            </div>

            <ProgressBar progress={progress} onBeginSeek={beginSeek} onEndSeek={endSeek} />

            <PlayerControls
              isPlaying={isPlaying}
              onTogglePlayback={togglePlayback}
              onShuffle={playRandomTrack}
              disabled={controlsDisabled}
            />
          </div>
        </div>
      ) : (
        <div className="spotify-player-dock-row">
          <div className="spotify-player-dock spotify-player-dock-expand" onMouseEnter={scheduleExpand}>
            <AlbumThumb track={currentTrack} isPlaying={isPlaying && !controlsDisabled} loading={controlsDisabled} />
            <TrackMarquee text={tickerText} className="spotify-marquee--dock" />
          </div>
          <div className="spotify-player-dock-controls" onMouseEnter={cancelExpand}>
            <PlayerControls
              isPlaying={isPlaying}
              onTogglePlayback={togglePlayback}
              onShuffle={playRandomTrack}
              disabled={controlsDisabled}
              size="mini"
            />
          </div>
        </div>
      )}
    </div>
  );
}
