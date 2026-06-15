import { COUNTRY_CODE, NEWS_API_KEY } from '../data/appConfig';

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json';
const BBC_WORLD_RSS = 'https://feeds.bbci.co.uk/news/world/rss.xml';
const HEADLINE_LIMIT = 3;

function getTodayIso() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function isPublishedToday(pubDate) {
  if (!pubDate) {
    return false;
  }

  const published = new Date(pubDate.replace(' ', 'T'));
  const now = new Date();

  return (
    published.getFullYear() === now.getFullYear() &&
    published.getMonth() === now.getMonth() &&
    published.getDate() === now.getDate()
  );
}

export function formatTodayDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function fetchTodayHolidays() {
  const year = new Date().getFullYear();
  const todayIso = getTodayIso();
  const response = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/${COUNTRY_CODE}`,
  );

  if (!response.ok) {
    throw new Error('Unable to load holidays');
  }

  const holidays = await response.json();
  if (!Array.isArray(holidays)) {
    throw new Error('Invalid holiday response');
  }

  const todayHolidays = holidays.filter((holiday) => holiday.date === todayIso);
  if (!todayHolidays.length) {
    return null;
  }

  return todayHolidays.map((holiday) => holiday.localName || holiday.name).join(' · ');
}

async function fetchHeadlinesFromNewsApi() {
  if (!NEWS_API_KEY) {
    return [];
  }

  const url = new URL('https://newsapi.org/v2/top-headlines');
  url.searchParams.set('country', COUNTRY_CODE.toLowerCase());
  url.searchParams.set('pageSize', String(HEADLINE_LIMIT));
  url.searchParams.set('apiKey', NEWS_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  return (payload.articles || [])
    .filter((article) => article?.title)
    .slice(0, HEADLINE_LIMIT)
    .map((article) => ({
      title: article.title.replace(/\s+-\s+[^-]+$/, ''),
      url: article.url,
      source: article.source?.name || '',
    }));
}

async function fetchHeadlinesFromRss() {
  const url = `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(BBC_WORLD_RSS)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to load headlines');
  }

  const payload = await response.json();
  if (payload.status !== 'ok' || !Array.isArray(payload.items)) {
    throw new Error(payload.message || 'Unable to load headlines');
  }

  const todayItems = payload.items.filter((item) => isPublishedToday(item.pubDate));
  const items = (todayItems.length ? todayItems : payload.items).slice(0, HEADLINE_LIMIT);

  return items
    .filter((item) => item?.title && item?.link)
    .map((item) => ({
      title: item.title.trim(),
      url: item.link,
      source: payload.feed?.title || 'BBC News',
    }));
}

export async function fetchTodayHeadlines() {
  try {
    const fromNewsApi = await fetchHeadlinesFromNewsApi();
    if (fromNewsApi.length) {
      return fromNewsApi;
    }
  } catch {
    // Fall back to RSS below.
  }

  return fetchHeadlinesFromRss();
}

export async function fetchTodayInfo() {
  const [holidayResult, headlineResult] = await Promise.allSettled([
    fetchTodayHolidays(),
    fetchTodayHeadlines(),
  ]);

  return {
    holiday: holidayResult.status === 'fulfilled' ? holidayResult.value : null,
    headlines: headlineResult.status === 'fulfilled' ? headlineResult.value : [],
    holidayError: holidayResult.status === 'rejected',
    headlinesError: headlineResult.status === 'rejected',
  };
}
