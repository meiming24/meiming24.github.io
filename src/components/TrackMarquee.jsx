import { useEffect, useRef, useState } from 'react';

export default function TrackMarquee({ text, className = '' }) {
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const [scrollStyle, setScrollStyle] = useState(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const textEl = textRef.current;
    if (!viewport || !textEl) {
      return undefined;
    }

    const measure = () => {
      const overflow = textEl.scrollWidth - viewport.clientWidth;
      if (overflow <= 4) {
        setScrollStyle(null);
        return;
      }

      const duration = Math.max(14, overflow / 14);
      setScrollStyle({
        '--marquee-overflow': `${overflow}px`,
        '--marquee-duration': `${duration}s`,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(textEl);

    return () => observer.disconnect();
  }, [text]);

  return (
    <div className={`spotify-marquee ${className}`.trim()} ref={viewportRef}>
      <p
        ref={textRef}
        className={`spotify-marquee-text${scrollStyle ? ' spotify-marquee-text--scroll' : ''}`}
        style={scrollStyle ?? undefined}
      >
        {text}
      </p>
    </div>
  );
}

function formatTrackLine(track, fallback = 'Loading track...') {
  if (!track?.name) {
    return fallback;
  }

  if (track.artist) {
    return `${track.name} by ${track.artist}`;
  }

  return track.name;
}

export { formatTrackLine };
