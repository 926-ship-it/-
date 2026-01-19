
import { Country, Channel } from '../types';

const API_BASE = 'https://iptv-org.github.io/api';
const PLAYLIST_BASE = 'https://iptv-org.github.io/iptv/countries';
const CATEGORY_BASE = 'https://iptv-org.github.io/iptv/categories';
const RADIO_API_BASE = 'https://de1.api.radio-browser.info/json/stations/bycountrycodeexact';

// 排除受限地区
const EXCLUDED_REGIONS: string[] = ['CN', 'TW', 'HK', 'MO'];

export const GLOBAL_COUNTRY: Country = { name: '全球顶级信道', code: 'GLOBAL', languages: ['en'], flag: '🌐' };

const FALLBACK_COUNTRIES: Country[] = [
    GLOBAL_COUNTRY,
    { name: '美国', code: 'US', languages: ['en'], flag: '🇺🇸' },
    { name: '日本', code: 'JP', languages: ['ja'], flag: '🇯🇵' },
    { name: '韩国', code: 'KR', languages: ['ko'], flag: '🇰🇷' },
    { name: '英国', code: 'GB', languages: ['en'], flag: '🇬🇧' },
    { name: '法国', code: 'FR', languages: ['fr'], flag: '🇫🇷' },
    { name: '新加坡', code: 'SG', languages: ['en'], flag: '🇸🇬' }
];

// 带超时的 Fetch 封装
async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export const getTimezone = (countryCode: string): string => {
  const map: Record<string, string> = { 
    'US': 'America/New_York', 'JP': 'Asia/Tokyo', 'GB': 'Europe/London', 
    'KR': 'Asia/Seoul', 'FR': 'Europe/Paris'
  };
  return map[countryCode] || 'UTC';
};

export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/countries.json`, 3000);
    if (!response.ok) return FALLBACK_COUNTRIES;
    const data = await response.json();
    const filtered = data
        .filter((c: Country) => !EXCLUDED_REGIONS.includes(c.code))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
    return filtered.length > 5 ? [GLOBAL_COUNTRY, ...filtered] : FALLBACK_COUNTRIES;
  } catch (error) { 
    return FALLBACK_COUNTRIES; 
  }
};

export const fetchChannelsByCountry = async (countryCode: string, refresh = false): Promise<Channel[]> => {
  if (EXCLUDED_REGIONS.includes(countryCode)) return [];
  if (countryCode === 'GLOBAL') return fetchGlobalTopChannels();
  
  try {
    const response = await fetchWithTimeout(`${PLAYLIST_BASE}/${countryCode.toLowerCase()}.m3u${refresh ? `?t=${Date.now()}` : ''}`, 5000);
    if (!response.ok) return [];
    const text = await response.text();
    return parseM3U(text).map(c => ({ ...c, type: 'tv' as const }));
  } catch (error) { 
    return []; 
  }
};

const fetchGlobalTopChannels = async (): Promise<Channel[]> => {
    // 精选极其稳定的顶级信道
    return [
        { id: 'abc-news', name: 'ABC News Live', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/ABC_News_Logo.svg', url: 'https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8', group: 'News' },
        { id: 'nhk-world', name: 'NHK World-Japan', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/NHK_World_Logo.svg', url: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/global/2003458/live.m3u8', group: 'News' },
        { id: 'france-24', name: 'France 24 English', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/France_24_Logo.svg', url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8', group: 'News' },
        { id: 'nasa-tv', name: 'NASA TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg', url: 'https://ntv1.akamaized.net/hls/live/2013975/NASA-NTV1-HLS/master.m3u8', group: 'Science' }
    ];
};

export const fetchRadioStations = async (countryCode: string): Promise<Channel[]> => {
  if (EXCLUDED_REGIONS.includes(countryCode) || countryCode === 'GLOBAL') return [];
  try {
    const response = await fetchWithTimeout(`${RADIO_API_BASE}/${countryCode}`, 4000);
    const data = await response.json();
    return data.map((s: any) => ({
      id: s.stationuuid,
      name: s.name,
      logo: s.favicon,
      url: s.url_resolved,
      group: s.tags || 'Radio',
      type: 'radio'
    }));
  } catch (e) { return []; }
};

export const fetchGlobalChannelsByCategory = async (category: string): Promise<Channel[]> => {
    const catMap: Record<string, string> = { '新闻': 'news', '体育': 'sports', '电影': 'movies', '少儿': 'kids' };
    const slug = catMap[category] || 'general';
    try {
        const response = await fetchWithTimeout(`${CATEGORY_BASE}/${slug}.m3u`, 5000);
        if (!response.ok) return [];
        const text = await response.text();
        return parseM3U(text).slice(0, 80);
    } catch (e) { return []; }
};

export const parseM3U = (content: string): Channel[] => {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let current: Partial<Channel> = {};
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const name = line.substring(line.lastIndexOf(',') + 1).trim();
      const logo = line.match(/tvg-logo="([^"]*)"/)?.[1] || null;
      const group = line.match(/group-title="([^"]*)"/)?.[1] || 'Public';
      current = { name, logo, group };
    } else if (line && !line.startsWith('#')) {
      if (current.name) {
        channels.push({ ...current as Channel, id: Math.random().toString(36).substr(2, 9), url: line });
        current = {};
      }
    }
  }
  return channels;
};
