import { Country, Channel } from '../types';

const API_BASE = 'https://iptv-org.github.io/api';
const PLAYLIST_BASE = 'https://iptv-org.github.io/iptv/countries';
const CATEGORY_BASE = 'https://iptv-org.github.io/iptv/categories';
const LANGUAGE_BASE = 'https://iptv-org.github.io/iptv/languages';
const RADIO_API_BASE = 'https://de1.api.radio-browser.info/json/stations/bycountrycodeexact';

// 排除受限地区 (严格执行版权规避)
const EXCLUDED_REGIONS: string[] = ['CN', 'TW', 'HK', 'MO'];

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
  'English': 'eng',
  'Spanish': 'spa',
  'French': 'fra'
};

// 预定义的全球虚拟国家对象
export const GLOBAL_COUNTRY: Country = { name: '全球顶级信道', code: 'GLOBAL', languages: ['en'], flag: '🌐' };

// 极大幅度扩充优质公共信道库 (移除所有涉及中国、台湾、香港的频道)
export const UNIVERSAL_CHANNELS: Channel[] = [
    { id: 'abc-news-us', name: 'ABC News Live (US)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/ABC_News_Logo.svg/1200px-ABC_News_Logo.svg.png', url: 'https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8', group: 'News', type: 'tv' },
    { id: 'nhk-world', name: 'NHK World-Japan (Japan)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/NHK_World_Logo.svg/1200px-NHK_World_Logo.svg.png', url: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/global/2003458/live.m3u8', group: 'News', type: 'tv' },
    { id: 'bloomberg-tv', name: 'Bloomberg TV (Finance)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Bloomberg_Television_logo.svg/1200px-Bloomberg_Television_logo.svg.png', url: 'https://liveproduction.global.ssl.fastly.net/us/playlist.m3u8', group: 'Business', type: 'tv' },
    { id: 'nasa-tv', name: 'NASA TV (Space)', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg', url: 'https://ntv1.akamaized.net/hls/live/2013975/NASA-NTV1-HLS/master.m3u8', group: 'Science', type: 'tv' },
    { id: 'france-24', name: 'France 24 English', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/France_24_Logo.svg/1200px-France_24_Logo.svg.png', url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8', group: 'News', type: 'tv' },
    { id: 'dw-news', name: 'DW News (Germany)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Deutsche_Welle_logo.svg/1200px-Deutsche_Welle_logo.svg.png', url: 'https://dwamdstream102.akamaized.net/hls/live/2015415/dwstream102/index.m3u8', group: 'News', type: 'tv' },
    { id: 'arirang-world', name: 'Arirang World (Korea)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Arirang_TV_logo.svg/1200px-Arirang_TV_logo.svg.png', url: 'https://amdlive.ctnd.com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8', group: 'General', type: 'tv' },
    { id: 'euronews', name: 'Euronews English', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Euronews_logo_2016.svg/1200px-Euronews_logo_2016.svg.png', url: 'https://euronews-euronews-world-1-us.samsung.wurl.tv/playlist.m3u8', group: 'News', type: 'tv' },
    { id: 'al-jazeera', name: 'Al Jazeera English', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Al_Jazeera_English_logo.svg/1200px-Al_Jazeera_English_logo.svg.png', url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8', group: 'News', type: 'tv' },
    { id: 'fashion-tv', name: 'Fashion TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Fashion_TV_logo.svg/1200px-Fashion_TV_logo.svg.png', url: 'https://f1.veta.tv/fashiontv/smil:fashiontv.smil/playlist.m3u8', group: 'Lifestyle', type: 'tv' },
    { id: 'redbull-tv', name: 'Red Bull TV (Extreme Sports)', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Red_Bull_Logo.svg/1200px-Red_Bull_Logo.svg.png', url: 'https://rbmn-live.akamaized.net/hls/live/590964/flrb/master.m3u8', group: 'Sports', type: 'tv' },
    { id: 'cbs-news', name: 'CBS News Live', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/CBS_News_logo_2020.svg/1200px-CBS_News_logo_2020.svg.png', url: 'https://cbsn-us.akamaized.net/hls/live/2020676/cbsn_us/master.m3u8', group: 'News', type: 'tv' }
];

// 大幅度扩展保底国家 (严格剔除中国/港澳台)
const FALLBACK_COUNTRIES: Country[] = [
    GLOBAL_COUNTRY,
    { name: '美国', code: 'US', languages: ['en'], flag: '🇺🇸' },
    { name: '日本', code: 'JP', languages: ['ja'], flag: '🇯🇵' },
    { name: '韩国', code: 'KR', languages: ['ko'], flag: '🇰🇷' },
    { name: '英国', code: 'GB', languages: ['en'], flag: '🇬🇧' },
    { name: '法国', code: 'FR', languages: ['fr'], flag: '🇫🇷' },
    { name: '德国', code: 'DE', languages: ['de'], flag: '🇩🇪' },
    { name: '加拿大', code: 'CA', languages: ['en'], flag: '🇨🇦' },
    { name: '澳大利亚', code: 'AU', languages: ['en'], flag: '🇦🇺' },
    { name: '巴西', code: 'BR', languages: ['pt'], flag: '🇧🇷' },
    { name: '印度', code: 'IN', languages: ['hi'], flag: '🇮🇳' },
    { name: '越南', code: 'VN', languages: ['vi'], flag: '🇻🇳' },
    { name: '新加坡', code: 'SG', languages: ['en'], flag: '🇸🇬' },
    { name: '泰国', code: 'TH', languages: ['th'], flag: '🇹🇭' },
    { name: '意大利', code: 'IT', languages: ['it'], flag: '🇮🇹' },
    { name: '西班牙', code: 'ES', languages: ['es'], flag: '🇪🇸' },
    { name: '墨西哥', code: 'MX', languages: ['es'], flag: '🇲🇽' },
    { name: '土耳其', code: 'TR', languages: ['tr'], flag: '🇹🇷' }
];

export const getTimezone = (countryCode: string): string => {
  const map: Record<string, string> = { 
    'US': 'America/New_York', 'JP': 'Asia/Tokyo', 'GB': 'Europe/London', 
    'KR': 'Asia/Seoul', 'FR': 'Europe/Paris', 'DE': 'Europe/Berlin', 'BR': 'America/Sao_Paulo'
  };
  return map[countryCode] || 'UTC';
};

export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await fetch(`${API_BASE}/countries.json`);
    if (!response.ok) return FALLBACK_COUNTRIES;
    const data = await response.json();
    const filtered = data
        .filter((c: Country) => !EXCLUDED_REGIONS.includes(c.code))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
    
    // 如果过滤后数据太少或 API 异常，则使用保底
    if (filtered.length < 5) return FALLBACK_COUNTRIES;
    
    return [GLOBAL_COUNTRY, ...filtered];
  } catch (error) { 
    console.error("Fetch countries failed, using fallbacks");
    return FALLBACK_COUNTRIES; 
  }
};

export const fetchChannelsByCountry = async (countryCode: string, refresh = false): Promise<Channel[]> => {
  // 即使在参数中传入，也进行二次拦截
  if (EXCLUDED_REGIONS.includes(countryCode)) return [];
  if (countryCode === 'GLOBAL' || countryCode === 'FAVORITES') return UNIVERSAL_CHANNELS;
  
  try {
    const response = await fetch(`${PLAYLIST_BASE}/${countryCode.toLowerCase()}.m3u${refresh ? `?t=${Date.now()}` : ''}`);
    if (!response.ok) return UNIVERSAL_CHANNELS;
    const text = await response.text();
    const channels = parseM3U(text).map(c => ({ ...c, type: 'tv' as const }));
    return channels.length > 0 ? channels : UNIVERSAL_CHANNELS;
  } catch (error) { 
    return UNIVERSAL_CHANNELS; 
  }
};

export const fetchGlobalChannelsByCategory = async (tagName: string): Promise<Channel[]> => {
  try {
    let url = '';
    if (LANGUAGE_MAP[tagName]) {
      url = `${LANGUAGE_BASE}/${LANGUAGE_MAP[tagName]}.m3u`;
    } else if (CATEGORY_MAP[tagName]) {
      url = `${CATEGORY_BASE}/${CATEGORY_MAP[tagName]}.m3u`;
    }

    if (!url) return UNIVERSAL_CHANNELS;

    const response = await fetch(url);
    if (!response.ok) return UNIVERSAL_CHANNELS;
    const text = await response.text();
    const channels = parseM3U(text).slice(0, 150).map(c => ({ ...c, type: 'tv' as const }));
    return channels.length > 0 ? channels : UNIVERSAL_CHANNELS;
  } catch (error) { return UNIVERSAL_CHANNELS; }
};

export const fetchRadioStations = async (countryCode: string, refresh = false): Promise<Channel[]> => {
  if (EXCLUDED_REGIONS.includes(countryCode)) return [];
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
      currentChannel = { 
        name: displayName, 
        logo: logoMatch ? logoMatch[1] : null, 
        group: groupMatch ? groupMatch[1] : '卫星流' 
      };
    } else if (line && !line.startsWith('#')) {
      if (currentChannel.name) {
        channels.push({ 
          ...currentChannel as Channel, 
          id: `ch-${Math.random().toString(36).substr(2, 9)}`, 
          url: line 
        });
        currentChannel = {};
      }
    }
  }
  return channels;
};
