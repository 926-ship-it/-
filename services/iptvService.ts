import { Country, Channel } from '../types';

const API_BASE = 'https://iptv-org.github.io/api';
const PLAYLIST_BASE = 'https://iptv-org.github.io/iptv/countries';
const RADIO_API_BASE = 'https://de1.api.radio-browser.info/json/stations/bycountrycodeexact';

// Basic mapping for major countries to represent timezones
const TIMEZONE_MAP: Record<string, string> = {
  'CN': 'Asia/Shanghai',
  'US': 'America/New_York',
  'JP': 'Asia/Tokyo',
  'GB': 'Europe/London',
  'KR': 'Asia/Seoul',
  'RU': 'Europe/Moscow',
  'FR': 'Europe/Paris',
  'DE': 'Europe/Berlin',
  'BR': 'America/Sao_Paulo',
  'IN': 'Asia/Kolkata',
  'AU': 'Australia/Sydney',
  'CA': 'America/Toronto',
  'MX': 'America/Mexico_City',
  'ID': 'Asia/Jakarta',
  'TR': 'Europe/Istanbul',
  'SA': 'Asia/Riyadh',
  'IT': 'Europe/Rome',
  'ES': 'Europe/Madrid',
  'TH': 'Asia/Bangkok',
  'VN': 'Asia/Ho_Chi_Minh',
  'TW': 'Asia/Taipei',
  'HK': 'Asia/Hong_Kong',
  'SG': 'Asia/Singapore',
};

// Hardcoded channels to ensure the user ALWAYS sees content, especially the ones they asked for
const FALLBACK_CHANNELS: Record<string, Channel[]> = {
    'US': [
        { id: 'nasa', name: 'NASA TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg', url: 'https://ntv1.akamaized.net/hls/live/2013975/NASA-NTV1-HLS/master.m3u8', group: 'Science', type: 'tv' },
        { id: '30a-tv', name: '30A TV Classic Movies', logo: 'https://i.imgur.com/7j2yKxX.png', url: 'https://30a-tv.com/feeds/30atv.m3u8', group: 'Movies', type: 'tv' },
        { id: '30a-music', name: '30A Music', logo: 'https://i.imgur.com/7j2yKxX.png', url: 'https://30a-tv.com/feeds/30amusic.m3u8', group: 'Music', type: 'tv' },
        { id: 'abc-news', name: 'ABC News Live', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/ABC_News_Logo.svg/1200px-ABC_News_Logo.svg.png', url: 'https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8', group: 'News', type: 'tv' },
        { id: 'redbull', name: 'Red Bull TV', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/RedBullTVLogo.svg/1200px-RedBullTVLogo.svg.png', url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8', group: 'Sports', type: 'tv' },
        { id: 'classic-arts', name: 'Classic Arts Showcase', logo: 'https://www.classicartsshowcase.org/wp-content/uploads/2016/09/CAS_Logo_White.png', url: 'https://jplayer.classicartsshowcase.org/hls/live.m3u8', group: 'Culture', type: 'tv' },
        { id: 'bloomberg', name: 'Bloomberg TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Bloomberg_Television_logo.svg/1200px-Bloomberg_Television_logo.svg.png', url: 'https://liveproduction.global.ssl.fastly.net/us/playlist.m3u8', group: 'News', type: 'tv' },
        { id: 'fashion-tv', name: 'Fashion TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/FashionTV_logo.svg/2560px-FashionTV_logo.svg.png', url: 'https://fash1043.cloudycdn.services/slive/_definst_/ftv_ftv_midnite_secret_k1y_27049_midnitesecret_1080p/chunklist.m3u8', group: 'Lifestyle', type: 'tv' },
        { id: 'nhk-world', name: 'NHK World', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/NHK_World_Logo.svg/1200px-NHK_World_Logo.svg.png', url: 'https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/global/2003458/live.m3u8', group: 'News', type: 'tv' },
        { id: 'ted', name: 'TED', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/TED_wordmark.svg/1200px-TED_wordmark.svg.png', url: 'https://ted-fastly.amagi.tv/playlist.m3u8', group: 'Education', type: 'tv' },
        { id: 'rakuten-action', name: 'Rakuten Action Movies', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Rakuten_TV_logo.svg/1200px-Rakuten_TV_logo.svg.png', url: 'https://rakuten-actionmovies-1-fr.samsung.wurl.com/manifest/playlist.m3u8', group: 'Movies', type: 'tv' },
    ],
    'GB': [
       { id: 'itv3', name: 'ITV3', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/ITV3_logo_2013.svg/1200px-ITV3_logo_2013.svg.png', url: '', group: 'Entertainment', type: 'tv' },
       { id: 'itv4', name: 'ITV4', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/ITV4_logo_2013.svg/1200px-ITV4_logo_2013.svg.png', url: '', group: 'Entertainment', type: 'tv' },
    ],
    'CN': [
        { id: 'cctv1', name: 'CCTV-1', logo: 'https://live.fanmingming.com/tv/CCTV1.png', url: 'http://39.134.115.163:8080/PLTV/88888910/224/3221225618/index.m3u8', group: 'CCTV', type: 'tv' },
        { id: 'cctv6', name: 'CCTV-6 电影', logo: 'https://live.fanmingming.com/tv/CCTV6.png', url: 'http://39.134.115.163:8080/PLTV/88888910/224/3221225623/index.m3u8', group: 'CCTV', type: 'tv' },
        { id: 'cctv13', name: 'CCTV-13 新闻', logo: 'https://live.fanmingming.com/tv/CCTV13.png', url: 'http://39.134.115.163:8080/PLTV/88888910/224/3221225630/index.m3u8', group: 'CCTV', type: 'tv' },
        { id: 'hunan', name: '湖南卫视', logo: 'https://live.fanmingming.com/tv/hunan.png', url: 'http://39.134.115.163:8080/PLTV/88888910/224/3221225672/index.m3u8', group: 'Satellite', type: 'tv' },
        { id: 'zhejiang', name: '浙江卫视', logo: 'https://live.fanmingming.com/tv/zhejiang.png', url: 'http://39.134.115.163:8080/PLTV/88888910/224/3221225668/index.m3u8', group: 'Satellite', type: 'tv' },
    ]
};

export const getTimezone = (countryCode: string): string => {
  return TIMEZONE_MAP[countryCode] || 'UTC';
};

export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await fetch(`${API_BASE}/countries.json`);
    if (!response.ok) throw new Error('Failed to fetch countries');
    const data = await response.json();
    return data.sort((a: Country, b: Country) => a.name.localeCompare(b.name));
  } catch (error) {
    // console.debug("Error fetching countries:", error);
    return [];
  }
};

export const fetchChannelsByCountry = async (countryCode: string, refresh = false): Promise<Channel[]> => {
  try {
    const cacheBuster = refresh ? `?t=${Date.now()}` : '';
    const response = await fetch(`${PLAYLIST_BASE}/${countryCode.toLowerCase()}.m3u${cacheBuster}`);
    
    if (!response.ok) {
        // Check fallback
        if (FALLBACK_CHANNELS[countryCode]) {
            return FALLBACK_CHANNELS[countryCode];
        }
        return [];
    }
    
    const text = await response.text();
    const channels = parseM3U(text);
    
    if (channels.length === 0 && FALLBACK_CHANNELS[countryCode]) {
        return FALLBACK_CHANNELS[countryCode];
    }
    
    return channels.map(c => ({ ...c, type: 'tv' }));
  } catch (error) {
    // Network error fallback
    if (FALLBACK_CHANNELS[countryCode]) {
        return FALLBACK_CHANNELS[countryCode];
    }
    return [];
  }
};

export const fetchRadioStations = async (countryCode: string, refresh = false): Promise<Channel[]> => {
  try {
    // Fetch top 500 stations for the country
    const url = `${RADIO_API_BASE}/${countryCode}${refresh ? '?hidebroken=true&limit=500' : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    // Map Radio Browser format to our Channel interface
    return data.map((station: any) => ({
      id: station.stationuuid,
      name: station.name.trim(),
      logo: station.favicon || null,
      url: station.url_resolved,
      group: station.tags || 'Radio',
      type: 'radio' as const
    }));
  } catch (error) {
    // console.debug(`Error fetching radio stations for ${countryCode}`, error);
    return [];
  }
};

export const parseM3U = (content: string): Channel[] => {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  
  let currentChannel: Partial<Channel> = {};

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const infoPart = line.substring(8);
      const commaIndex = infoPart.lastIndexOf(',');
      const displayName = infoPart.substring(commaIndex + 1).trim();
      
      const logoMatch = infoPart.match(/tvg-logo="([^"]*)"/);
      const groupMatch = infoPart.match(/group-title="([^"]*)"/);
      
      // Generate a deterministic ID based on the name to help with favorites/persistence
      let hash = 0;
      for (let i = 0; i < displayName.length; i++) {
        hash = ((hash << 5) - hash) + displayName.charCodeAt(i);
        hash |= 0;
      }
      const id = `ch-${Math.abs(hash)}`;

      currentChannel = {
        name: displayName,
        logo: logoMatch ? logoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'Uncategorized',
        id: id
      };
    } else if (!line.startsWith('#')) {
      if (currentChannel.name) {
        // Update ID to include URL hash for uniqueness
        let hash = 0;
        const combo = currentChannel.name + line;
        for (let i = 0; i < combo.length; i++) {
           hash = ((hash << 5) - hash) + combo.charCodeAt(i);
           hash |= 0;
        }
        
        channels.push({
          ...currentChannel as Channel,
          id: `ch-${Math.abs(hash)}`,
          url: line
        });
        currentChannel = {};
      }
    }
  }

  return channels;
};