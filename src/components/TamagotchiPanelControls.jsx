import { primeTamagotchiAudio } from '../tamagotchi/audio';

function PauseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4.5" height="14" rx="1.2" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1.2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.8v12.4c0 .9 1 .4 1.6-.2l8.2-6c.6-.5.6-1.5 0-2l-8.2-6c-.6-.6-1.6-1.1-1.6-.2Z" />
    </svg>
  );
}

function NewGameIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4v4h-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShellSkinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55">
      <path
        d="M15.8 4.4c2.4.7 3.9 3 3.9 5.7 0 3.2-1.8 6.4-4.4 8"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M12 3.1C8.4 3.1 5.5 6.4 5.5 10.5 5.5 15 8.4 19.2 12 20.5c3.6-1.3 6.5-5.5 6.5-10 0-4.1-2.9-7.4-6.5-7.4Z"
        strokeLinejoin="round"
      />
      <rect x="9.35" y="8.8" width="5.3" height="4.35" rx="0.55" strokeWidth="1.35" />
      <circle cx="9.25" cy="16.95" r="0.82" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.65" r="0.82" fill="currentColor" stroke="none" />
      <circle cx="14.75" cy="16.95" r="0.82" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DockButton({ label, className, disabled, pressed, onClick, children }) {
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      onClick={(event) => {
        primeTamagotchiAudio();
        onClick(event);
      }}
    >
      {children}
    </button>
  );
}

export default function TamagotchiPanelControls({
  disabled,
  pauseDisabled,
  isPaused,
  skinsOpen,
  onTogglePause,
  onNewGame,
  onToggleSkins,
}) {
  return (
    <div className="tamagotchi-dock">
      <DockButton
        label={isPaused ? 'Resume game' : 'Pause game'}
        className={`tamagotchi-dock-btn tamagotchi-dock-btn--pause${isPaused ? ' tamagotchi-dock-btn--active' : ''}`}
        disabled={pauseDisabled}
        pressed={isPaused}
        onClick={onTogglePause}
      >
        {isPaused ? <PlayIcon /> : <PauseIcon />}
      </DockButton>

      <DockButton
        label="New game"
        className="tamagotchi-dock-btn tamagotchi-dock-btn--new"
        disabled={disabled}
        onClick={onNewGame}
      >
        <NewGameIcon />
      </DockButton>

      <DockButton
        label="Tamagotchi shell skins"
        className={`tamagotchi-dock-btn tamagotchi-dock-btn--skin${skinsOpen ? ' tamagotchi-dock-btn--active' : ''}`}
        pressed={skinsOpen}
        onClick={onToggleSkins}
      >
        <ShellSkinIcon />
      </DockButton>
    </div>
  );
}
