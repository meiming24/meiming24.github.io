import { useEffect, useState } from 'react';

const LOADING_LINES = [
  'Selecting from the collection...',
  'Unveiling a masterpiece...',
  'Curating something beautiful...',
  'Almost ready to hang...',
];

export default function ArtLoading() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % LOADING_LINES.length);
    }, 2400);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="art-loading" aria-live="polite" aria-busy="true">
      <div className="art-loading-shimmer" aria-hidden="true" />
      <div className="art-loading-frame" aria-hidden="true">
        <span className="art-loading-corner art-loading-corner--tl" />
        <span className="art-loading-corner art-loading-corner--tr" />
        <span className="art-loading-corner art-loading-corner--bl" />
        <span className="art-loading-corner art-loading-corner--br" />
      </div>
      <div className="art-loading-copy">
        <span className="art-loading-label">The Met</span>
        <p className="art-loading-line" key={lineIndex}>
          {LOADING_LINES[lineIndex]}
        </p>
      </div>
    </div>
  );
}
