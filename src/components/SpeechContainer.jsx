export default function SpeechContainer({
  visible,
  listening,
  transcript,
  onExit,
  onStartListening,
}) {
  if (!visible) return null;

  return (
    <div className="speech-container" style={{ display: 'block' }}>
      <div className="speech-wrapper">
        <div className="exit-speech" role="button" tabIndex={0} onClick={onExit} onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onExit();
        }}>
          <svg
            className="w-6 h-6 text-gray-800 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
        </div>
        <div
          className="speech-icon"
          style={{ display: listening ? 'none' : 'block' }}
          role="button"
          tabIndex={0}
          onClick={onStartListening}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onStartListening();
          }}
        >
          <img src="/icons/mic-icon.png" alt="Start listening" />
        </div>
        <div className="sound-container" style={{ display: listening ? 'flex' : 'none' }}>
          <div className="sound-wave">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div id="transcript">{transcript}</div>
      </div>
    </div>
  );
}
