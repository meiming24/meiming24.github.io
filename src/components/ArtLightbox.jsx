import { useEffect, useState } from 'react';
import { isArtImagePreloaded, preloadArtImage } from '../utils/randomArt';

export default function ArtLightbox({ artwork, onClose }) {
  const previewUrl = artwork?.url;
  const fullUrl = artwork?.fullUrl || previewUrl;
  const hasHigherRes = Boolean(fullUrl && previewUrl && fullUrl !== previewUrl);
  const [displayUrl, setDisplayUrl] = useState(previewUrl);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!previewUrl) {
      return undefined;
    }

    if (!hasHigherRes || isArtImagePreloaded(fullUrl)) {
      setDisplayUrl(fullUrl);
      setIsUpgrading(false);
      return undefined;
    }

    let cancelled = false;
    setDisplayUrl(previewUrl);
    setIsUpgrading(true);

    preloadArtImage(fullUrl).then((loaded) => {
      if (cancelled) {
        return;
      }

      setDisplayUrl(loaded ? fullUrl : previewUrl);
      setIsUpgrading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [fullUrl, hasHigherRes, previewUrl]);

  if (!previewUrl) {
    return null;
  }

  return (
    <div
      className="art-lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={artwork.title}
      aria-busy={isUpgrading}
    >
      <button
        className="art-lightbox-close"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close artwork"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <figure className="art-lightbox-content" onClick={(event) => event.stopPropagation()}>
        <div className="art-lightbox-image-wrap">
          <img
            className={`art-lightbox-image${isUpgrading ? ' art-lightbox-image--preview' : ''}`}
            src={displayUrl}
            alt={artwork.title}
            decoding="async"
            fetchPriority="high"
          />
          {isUpgrading ? <span className="art-lightbox-upgrading" aria-hidden="true" /> : null}
        </div>
        <figcaption className="art-lightbox-caption">
          <span className="art-lightbox-caption-label">Now viewing</span>
          <span className="art-lightbox-title">{artwork.title}</span>
          {artwork.description ? (
            <span className="art-lightbox-description">{artwork.description}</span>
          ) : null}
        </figcaption>
      </figure>
    </div>
  );
}
