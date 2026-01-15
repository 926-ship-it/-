
import { Country, Channel } from '../types';

const API_BASE = 'https://iptv-org.github.io/api';
const PLAYLIST_BASE = 'https://iptv-org.github.io/iptv/countries';
const CATEGORY_BASE = 'https://iptv-org.github.io/iptv/categories';
const LANGUAGE_BASE = 'https://iptv-org.github.io/iptv/languages';
const RADIO_API_BASE = 'https://de1.api.radio-browser.info/json/stations/bycountrycodeexact';

// 排除受限地区
const EXCLUDED_REGIONS = ['CN', 'HK', 'TW'];

// 映射中文标签到英文分类名或语言代码
const CATEGORY_MAP: Record<string, string> = {
  '新闻': 'news',
  '体育': 'sports',
  '电影': 'movies',
  '音乐': 'music',
  '少儿': 'kids',
  '探索': 'documentary',
  '国际': 'general',
  '时尚': 'lifestyle',
  '喜剧': 'comedy',
  '经典': 'classic',
  '风景': 'relax',
  '动作': 'action'
};

const LANGUAGE_MAP: Record<string, string> = {
  '中文': 'zho'
};

// 全球顶级信道兜底库
export const UNIVERSAL_CHANNELS: Channel[] = [
    { id: 'abc-news-us', name: 'ABC News Live', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/ABC_News_Logo.svg/1200px-ABC_News_Logo.svg.png', url: 'https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8', group: 'News', type: 'tv' },
    { id: 'nhk-world', name: 'NHK World-Japan', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/NHK_World_Logo.svg/1200px-NHK_World_Logo.svg.png', url: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/global/2003458/live.m3u8', group: 'News', type: 'tv' },
    { id: 'nasa-tv', name: 'NASA TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg', url: 'https://ntv1.akamaized.net/hls/live/2013975/NASA-NTV1-HLS/master.m3u8', group: 'Science', type: 'tv' },
    { id: 'bloomberg-tv', name: 'Bloomberg Global', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Bloomberg_Television_logo.svg/1200px-Bloomberg_Television_logo.svg.png', url: 'https://liveproduction.global.ssl.fastly.net/us/playlist.m3u8', group: 'Business', type: 'tv' },
    { id: 'france-24', name: 'France 24 English', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/France_24_Logo.svg/1200px-France_24_Logo.svg.png', url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8', group: 'News', type: 'tv' },
    { id: 'dw-news', name: 'DW News Global', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Deutsche_Welle_logo.svg', url: 'https://dwamdstream102.akamaized.net/hls/live/2015430/dwstream102/index.m3u8', group: 'News', type: 'tv' },
    { id: 'al-jazeera', name: 'Al Jazeera English', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Al_jazeera_logo.svg/1200px-Al_jazeera_logo.svg.png', url: 'https://live-hls-web-aje.akamaized.net/aje/index.m3u8', group: 'News', type: 'tv' }
];

const FALLBACK_COUNTRIES: Country[] = [
    { name: '全球信道 (推荐)', code: 'GLOBAL', languages: ['en'], flag: '🌐' },
    { name: '美国', code: 'US', languages: ['en'], flag: '🇺🇸' },
    { name: '英国', code: 'GB', languages: ['en'], flag: '🇬🇧' },
    { name: '日本', code: 'JP', languages: ['ja'], flag: '🇯🇵' },
    { name: '韩国', code: 'KR', languages: ['ko'], flag: '🇰🇷' },
];

export const getTimezone = (countryCode: string): string => {
  const map: Record<string, string> = { 'US': 'America/New_York', 'JP': 'Asia/Tokyo', 'GB': 'Europe/London', 'KR': 'Asia/Seoul' };
  return map[countryCode] || 'UTC';
};

export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await fetch(`${API_BASE}/countries.json`);
    if (!response.ok) return FALLBACK_COUNTRIES;
    const data = await response.json();
    return data
        .filter((c: Country) => !EXCLUDED_REGIONS.includes(c.code))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
  } catch (error) { return FALLBACK_COUNTRIES; }
};

export const fetchChannelsByCountry = async (countryCode: string, refresh = false): Promise<Channel[]> => {
  if (countryCode === 'GLOBAL' || countryCode === 'FAVORITES') return UNIVERSAL_CHANNELS;
  try {
    const response = await fetch(`${PLAYLIST_BASE}/${countryCode.toLowerCase()}.m3u${refresh ? `?t=${Date.now()}` : ''}`);
    if (!response.ok) return UNIVERSAL_CHANNELS;
    const text = await response.text();
    return parseM3U(text).map(c => ({ ...c, type: 'tv' }));
  } catch (error) { return UNIVERSAL_CHANNELS; }
};

// 按分类或语言获取全球频道
export const fetchGlobalChannelsByCategory = async (tagName: string): Promise<Channel[]> => {
  try {
    let url = '';
    if (LANGUAGE_MAP[tagName]) {
      // 如果是语言标签（如“中文”）
      url = `${LANGUAGE_BASE}/${LANGUAGE_MAP[tagName]}.m3u`;
    } else if (CATEGORY_MAP[tagName]) {
      // 如果是普通分类标签
      url = `${CATEGORY_BASE}/${CATEGORY_MAP[tagName]}.m3u`;
    }

    if (!url) return UNIVERSAL_CHANNELS;

    const response = await fetch(url);
    if (!response.ok) return UNIVERSAL_CHANNELS;
    const text = await response.text();
    return parseM3U(text).slice(0, 100).map(c => ({ ...c, type: 'tv' }));
  } catch (error) { return UNIVERSAL_CHANNELS; }
};

export const fetchRadioStations = async (countryCode: string, refresh = false): Promise<Channel[]> => {
  if (countryCode === 'GLOBAL') return [];
  try {
    const response = await fetch(`${RADIO_API_BASE}/${countryCode}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((station: any) => ({
      id: station.stationuuid,
      name: station.name.trim(),
      logo: station.favicon || null,
      url: station.url_resolved,
      group: station.tags || 'Radio',
      type: 'radio' as const
    }));
  } catch (error) { return []; }
};

export const parseM3U = (content: string): Channel[] => {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> = {};
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const displayName = line.substring(line.lastIndexOf(',') + 1).trim();
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      currentChannel = { name: displayName, logo: logoMatch ? logoMatch[1] : null, group: groupMatch ? groupMatch[1] : 'Uncategorized' };
    } else if (line && !line.startsWith('#')) {
      if (currentChannel.name) {
        channels.push({ ...currentChannel as Channel, id: `ch-${Math.random().toString(36).substr(2, 9)}`, url: line });
        currentChannel = {};
      }
    }
  }
  return channels;
};
