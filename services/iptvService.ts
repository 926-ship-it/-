
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
    // Silently fail or log debug only to prevent console spam
    // console.debug("Error fetching countries:", error);
    return [];
  }
};

export const fetchChannelsByCountry = async (countryCode: string, refresh = false): Promise<Channel[]> => {
  try {
    const cacheBuster = refresh ? `?t=${Date.now()}` : '';
    const response = await fetch(`${PLAYLIST_BASE}/${countryCode.toLowerCase()}.m3u${cacheBuster}`);
    if (!response.ok) {
        // Return empty array for 404s or other errors without loud console logs
        return [];
    }
    const text = await response.text();
    const channels = parseM3U(text);
    return channels.map(c => ({ ...c, type: 'tv' }));
  } catch (error) {
    // console.debug(`Error fetching TV channels for ${countryCode}`, error);
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
