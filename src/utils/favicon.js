export function cleanDomain(domain) {
  return (domain || '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase();
}

/** Simple Icons slugs + colors that read well on dark shortcut circles. */
const DOMAIN_ICON_CONFIG = {
  'github.com': { slug: 'github', color: 'white', softEdges: true },
  'stackoverflow.com': { slug: 'stackoverflow', color: 'F58025', softEdges: true },
  'chat.openai.com': { slug: 'openai', color: 'white' },
  'chatgpt.com': { slug: 'openai', color: 'white' },
  'openai.com': { slug: 'openai', color: 'white' },
  'reddit.com': { slug: 'reddit', color: 'FF4500' },
  'youtube.com': { slug: 'youtube', color: 'FF0000' },
  'open.spotify.com': { slug: 'spotify', color: '1ED760' },
  'spotify.com': { slug: 'spotify', color: '1ED760' },
  'netflix.com': { slug: 'netflix', color: 'E50914' },
  'store.steampowered.com': { slug: 'steam', color: 'white', softEdges: true },
  'steamcommunity.com': { slug: 'steam', color: 'white', softEdges: true },
};

function simpleIconUrl(slug, color) {
  if (color) {
    return `https://cdn.simpleicons.org/${slug}/${color}`;
  }

  return `https://cdn.simpleicons.org/${slug}`;
}

function resolveIconConfig(domain) {
  const clean = cleanDomain(domain);
  if (!clean) {
    return null;
  }

  if (DOMAIN_ICON_CONFIG[clean]) {
    return DOMAIN_ICON_CONFIG[clean];
  }

  const parts = clean.split('.');
  if (parts.length >= 2) {
    const root = parts.slice(-2).join('.');
    if (DOMAIN_ICON_CONFIG[root]) {
      return DOMAIN_ICON_CONFIG[root];
    }
  }

  return null;
}

function faviconFallbacks(domain) {
  const clean = cleanDomain(domain);

  if (!clean) {
    return ['https://www.google.com/s2/favicons?domain=example.com&sz=128'];
  }

  const siteUrl = encodeURIComponent(`https://${clean}`);

  return [
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${siteUrl}&size=128`,
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(clean)}.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=128`,
  ];
}

export function faviconSourcesForDomain(domain) {
  const iconConfig = resolveIconConfig(domain);
  const fallbacks = faviconFallbacks(domain);

  if (!iconConfig) {
    return fallbacks;
  }

  return [
    simpleIconUrl(iconConfig.slug, iconConfig.color),
    ...fallbacks,
  ];
}

export function faviconForDomain(domain) {
  return faviconSourcesForDomain(domain)[0];
}

export function usesBrandIcon(domain) {
  return resolveIconConfig(domain) !== null;
}

export function iconUsesSoftEdges(domain) {
  return Boolean(resolveIconConfig(domain)?.softEdges);
}
