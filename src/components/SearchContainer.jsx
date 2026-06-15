import { useCallback, useEffect, useState } from 'react';
import { fetchRandomArtwork, preloadArtImage, prefetchRandomArtwork } from '../utils/randomArt';
import ArtLightbox from './ArtLightbox';
import ArtLoading from './ArtLoading';
import SearchEnginePicker from './SearchEnginePicker';

export default function SearchContainer({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onMicClick,
  searchEngine,
  onSearchEngineChange,
}) {
  const [artwork, setArtwork] = useState(null);
  const [imageReady, setImageReady] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const queueNextArtwork = useCallback(() => {
    prefetchRandomArtwork().then((nextArtwork) => {
      if (!nextArtwork) {
        return;
      }

      preloadArtImage(nextArtwork.url);
      if (nextArtwork.fullUrl) {
        preloadArtImage(nextArtwork.fullUrl);
      }
    });
  }, []);

  const warmFullImage = useCallback(() => {
    if (artwork?.fullUrl) {
      preloadArtImage(artwork.fullUrl);
    }
  }, [artwork?.fullUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadArtwork() {
      try {
        setImageReady(false);
        const nextArtwork = await fetchRandomArtwork();
        if (!cancelled) {
          setArtwork(nextArtwork);
        }
      } catch (error) {
        console.error('Failed to load random artwork:', error);
        if (!cancelled) {
          setArtwork(null);
        }
      }
    }

    loadArtwork();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleImageReady = useCallback((event) => {
    if (event.currentTarget.complete) {
      setImageReady(true);
    }
  }, []);

  const handleImageRef = useCallback((node) => {
    if (node?.complete && node.naturalWidth > 0) {
      setImageReady(true);
    }
  }, [artwork?.url]);

  useEffect(() => {
    if (imageReady && artwork?.fullUrl) {
      preloadArtImage(artwork.fullUrl);
    }
  }, [artwork?.fullUrl, imageReady]);

  useEffect(() => {
    if (imageReady) {
      queueNextArtwork();
    }
  }, [imageReady, queueNextArtwork]);

  const showLoading = !artwork || !imageReady;

  return (
    <div className="search-container">
      <div className="gif-container">
        {showLoading ? <ArtLoading /> : null}
        {artwork?.url ? (
          <button
            type="button"
            className={`art-image-button${imageReady ? ' art-image-button--visible' : ''}`}
            onClick={() => setLightboxOpen(true)}
            onMouseEnter={warmFullImage}
            onFocus={warmFullImage}
            aria-label={`View full size: ${artwork.title}`}
          >
            <img
              ref={handleImageRef}
              src={artwork.url}
              alt={artwork.title}
              title={artwork.title}
              onLoad={handleImageReady}
            />
          </button>
        ) : null}
      </div>
      {lightboxOpen ? <ArtLightbox artwork={artwork} onClose={closeLightbox} /> : null}
      <div className="search-input-wrapper">
        <div className="search-input-container">
          <SearchEnginePicker engine={searchEngine} onChange={onSearchEngineChange} />
          <input
            type="text"
            placeholder={searchEngine.placeholder}
            id="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchSubmit();
              }
            }}
          />
        </div>
        <button className="mic-button" type="button" onClick={onMicClick} aria-label="Voice search" />
        <button className="camera-button" type="button" aria-label="Image search" />
      </div>
    </div>
  );
}
