import { MET_ART_OBJECT_IDS } from '../data/metArtIds';

const MET_SEARCH_URL =
  'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=painting';
const MET_OBJECT_IDS_KEY = 'met-painting-object-ids';
const PARALLEL_FETCH_COUNT = 4;

let cachedObjectIds = MET_ART_OBJECT_IDS;
let backgroundHydrationStarted = false;

function pickRandomIds(objectIds, count) {
  const pool = [...objectIds];
  const picked = [];

  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }

  return picked;
}

function hydrateObjectIdsInBackground() {
  if (backgroundHydrationStarted) {
    return;
  }

  backgroundHydrationStarted = true;

  const storedIds = sessionStorage.getItem(MET_OBJECT_IDS_KEY);
  if (storedIds) {
    cachedObjectIds = JSON.parse(storedIds);
    return;
  }

  fetch(MET_SEARCH_URL)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data?.objectIDs?.length) {
        return;
      }

      cachedObjectIds = data.objectIDs;
      sessionStorage.setItem(MET_OBJECT_IDS_KEY, JSON.stringify(data.objectIDs));
    })
    .catch(() => {
      backgroundHydrationStarted = false;
    });
}

function buildArtworkDescription(artwork) {
  const parts = [
    artwork.artistDisplayName,
    artwork.objectDate,
    artwork.medium,
  ].filter(Boolean);

  return parts.join(' · ');
}

function mapArtworkResponse(artwork) {
  return {
    url: artwork.primaryImageSmall || artwork.primaryImage,
    fullUrl: artwork.primaryImage,
    title: artwork.title || 'Artwork',
    description: buildArtworkDescription(artwork),
  };
}

const preloadedUrls = new Set();

export function preloadArtImage(url) {
  if (!url || preloadedUrls.has(url)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';

    image.onload = () => {
      preloadedUrls.add(url);
      resolve(true);
    };

    image.onerror = () => resolve(false);
    image.src = url;

    if (image.complete) {
      preloadedUrls.add(url);
      resolve(true);
    }
  });
}

export function isArtImagePreloaded(url) {
  return Boolean(url && preloadedUrls.has(url));
}

async function fetchMetObject(objectId) {
  const response = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`,
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function fetchRandomArtwork() {
  hydrateObjectIdsInBackground();

  for (let round = 0; round < 3; round += 1) {
    const candidates = pickRandomIds(cachedObjectIds, PARALLEL_FETCH_COUNT);
    const results = await Promise.all(candidates.map((objectId) => fetchMetObject(objectId)));
    const artwork = results.find((item) => item?.primaryImage);

    if (artwork) {
      return mapArtworkResponse(artwork);
    }
  }

  throw new Error('No artwork with image');
}

export function prefetchRandomArtwork() {
  return fetchRandomArtwork().catch(() => null);
}
