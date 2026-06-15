export const SEARCH_ENGINES = [
  {
    id: 'google',
    name: 'Google',
    icon: 'https://assets.codepen.io/1468070/Google+G+Icon.png',
    placeholder: 'Search Google',
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    icon: null,
    placeholder: 'Search DuckDuckGo',
    buildUrl: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '/icons/youtube.png',
    placeholder: 'Search YouTube',
    buildUrl: (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  },
];

export const DEFAULT_SEARCH_ENGINE_ID = 'google';

export function getSearchEngine(id) {
  return SEARCH_ENGINES.find((engine) => engine.id === id) || SEARCH_ENGINES[0];
}
