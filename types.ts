
export interface Country {
  name: string;
  code: string;
  languages: string[];
  flag: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  group?: string;
  type?: 'tv' | 'radio';
}

export interface ChannelCategory {
  name: string;
  channels: Channel[];
}

export interface ThemeStyles {
  bgMain: string;
  bgSidebar: string;
  textMain: string;
  textDim: string;
  border: string;
  card: string;
  cardHover: string;
  button: string;
  buttonActive: string;
  buttonPrimary: string;
  input: string;
  font: string;
  accentColor: string; // Hex for inline styles
  layoutShape: string;
  shadow: string;
  bgPattern?: string; // NEW: Decorative background class
}

export interface AppTheme {
  id: string;
  name: string;
  type: 'default' | 'web95' | 'kids' | 'acid' | 'glass' | 'cartoon';
  styles: ThemeStyles;
}

export interface Reminder {
  id: string;
  channelId: string;
  channelName: string;
  timeStr: string; // HH:mm format
  created: number;
}

export type PetType = 'cat' | 'dog' | 'robot' | 'bunny' | null;

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface AppSettings {
  enableSound: boolean;
}