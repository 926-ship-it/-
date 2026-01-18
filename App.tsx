
import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelGrid } from './components/ChannelGrid';
import { FavoritesBar } from './components/FavoritesBar'; 
import { AiChatPet } from './components/AiChatPet';
import { SettingsModal } from './components/SettingsModal';
import { ImportModal } from './components/ImportModal';
import { fetchCountries, fetchChannelsByCountry, fetchRadioStations, fetchGlobalChannelsByCategory, getTimezone, GLOBAL_COUNTRY, parseM3U } from './services/iptvService';
import { Country, Channel, AppTheme, Reminder, Language, AppSettings } from './types';
import { Menu, RefreshCw, Shuffle, Globe, Loader2, Sparkles } from 'lucide-react';

const THEMES: AppTheme[] = [
  {
    id: 'cyber',
    name: { zh: '星际轨道', en: 'Orbital' },
    type: 'glass',
    styles: {
      bgMain: 'bg-aurora-cyber', bgSidebar: 'bg-black/60 backdrop-blur-3xl border-r border-white/5',
      textMain: 'text-white', textDim: 'text-cyan-400/50', border: 'border-white/10',
      card: 'glass-card hover:border-cyan-500/40',
      cardHover: 'hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]', button: 'bg-white/5 text-white',
      buttonActive: 'bg-cyan-500 text-black shadow-lg', buttonPrimary: 'bg-cyan-400 text-black',
      input: 'bg-black/40 border-white/10 text-white', font: 'font-sans', layoutShape: 'rounded-[2rem]', shadow: 'shadow-2xl', accentColor: 'text-cyan-400'
    }
  },
  {
    id: 'zen',
    name: { zh: '极简禅意', en: 'Zen' },
    type: 'zen',
    styles: {
      bgMain: 'bg-aurora-zen', bgSidebar: 'bg-white/40 backdrop-blur-xl border-r border-gray-100',
      textMain: 'text-gray-900', textDim: 'text-gray-400', border: 'border-gray-200',
      card: 'bg-white/80 border border-gray-100 shadow-sm',
      cardHover: 'hover:shadow-md', button: 'bg-gray-100 text-gray-600',
      buttonActive: 'bg-gray-900 text-white', buttonPrimary: 'bg-gray-800 text-white',
      input: 'bg-white/80 border-gray-200 text-gray-900', font: 'font-serif', layoutShape: 'rounded-md', shadow: 'shadow-sm', accentColor: 'text-gray-500'
    }
  }
];

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [lang, setLang] = useState<Language>('zh');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<'tv' | 'radio'>('tv');
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [theme, setTheme] = useState<AppTheme>(THEMES[0]);
  const [discoveryTag, setDiscoveryTag] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const init = async () => {
      const data = await fetchCountries();
      setCountries(data);
      setSelectedCountry(data[0]);
      const savedFavs = localStorage.getItem('looq_favs');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      setIsReady(true);
    };
    init();
  }, []);

  const loadChannels = useCallback(async () => {
    if (!selectedCountry) return;
    setLoading(true);
    try {
        let data: Channel[] = [];
        if (discoveryTag) {
            data = await fetchGlobalChannelsByCategory(discoveryTag);
        } else {
            data = mode === 'tv' ? await fetchChannelsByCountry(selectedCountry.code) : await fetchRadioStations(selectedCountry.code);
        }
        setChannels(data);
        if (data.length > 0 && !currentChannel) setCurrentChannel(data[0]);
    } catch (e) { setChannels([]); }
    setLoading(false);
  }, [selectedCountry, mode, discoveryTag]);

  useEffect(() => { if (isReady) loadChannels(); }, [loadChannels, isReady]);

  const toggleFavorite = (channel: Channel) => {
    setFavorites(prev => {
        const isFav = prev.some(f => f.id === channel.id);
        const next = isFav ? prev.filter(f => f.id !== channel.id) : [...prev, channel];
        localStorage.setItem('looq_favs', JSON.stringify(next));
        return next;
    });
  };

  if (!isReady) return (
    <div className="h-screen w-full bg-[#050508] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  );

  return (
    <div className={`flex h-screen w-full ${theme.styles.bgMain} ${theme.styles.font} overflow-hidden relative`}>
      <Sidebar 
        countries={countries} selectedCountry={selectedCountry} 
        onSelectCountry={(c) => { setDiscoveryTag(null); setSelectedCountry(c); }}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} mode={mode} onModeChange={setMode}
        themes={THEMES} currentTheme={theme} onThemeChange={setTheme}
        favorites={favorites} onSelectFavorite={setCurrentChannel} 
        onImportM3U={() => setShowImport(true)} settings={{enableSound: true}}
        onToggleSound={() => {}} onOpenSettings={() => setShowSettings(true)}
        history={[]} lang={lang} reminders={[]} onDeleteReminder={()=>{}} onPlayReminder={()=>{}}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 z-10">
        <header className={`px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b ${theme.styles.border} ${theme.styles.bgSidebar}`}>
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-white/80 hover:text-white"><Menu className="w-5 h-5" /></button>
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <span className="text-xl md:text-3xl shrink-0">{selectedCountry?.flag}</span>
                    <h1 className={`text-sm md:text-xl font-black uppercase tracking-tighter truncate ${theme.styles.textMain}`}>
                        {discoveryTag || selectedCountry?.name}
                    </h1>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="text-[9px] md:text-[10px] font-black text-white/30 hover:text-white/60 uppercase px-2 py-1">
                    {lang === 'zh' ? 'EN' : 'CN'}
                </button>
                <button onClick={() => loadChannels()} className={`p-1.5 md:p-2 rounded-lg ${theme.styles.button} ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw className="w-3.5 h-3.5 md:w-4 h-4" />
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scroll-smooth">
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
                <section className="space-y-4">
                    <VideoPlayer 
                        channel={currentChannel} country={selectedCountry} theme={theme}
                        isFavorite={!!currentChannel && favorites.some(f => f.id === currentChannel.id)}
                        onToggleFavorite={() => currentChannel && toggleFavorite(currentChannel)}
                        lang={lang}
                    />
                    <FavoritesBar favorites={favorites} currentChannel={currentChannel} onSelectChannel={setCurrentChannel} theme={theme} mode={mode} />
                </section>

                <section className="space-y-4 md:space-y-6">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <h2 className={`text-[10px] md:text-sm font-black uppercase tracking-widest ${theme.styles.textMain}`}>
                            {lang === 'zh' ? '频道扫描' : 'CHANNELS'}
                        </h2>
                    </div>
                    <ChannelGrid 
                        channels={channels} currentChannel={currentChannel} onSelectChannel={setCurrentChannel}
                        loading={loading} mode={mode} theme={theme} favorites={favorites} onToggleFavorite={toggleFavorite}
                    />
                </section>

                <section className="flex justify-end pt-8 pb-16 md:pb-24 border-t border-dashed border-white/5">
                    <div className="flex flex-col items-end gap-2 md:gap-3">
                        <div className="text-right space-y-0.5 px-4 mb-1">
                            <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${theme.styles.textDim} opacity-40`}>AI Companion</p>
                        </div>
                        <AiChatPet theme={theme} currentChannels={channels} onSelectChannel={setCurrentChannel} lang={lang} />
                    </div>
                </section>
            </div>
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={{enableSound: true}} onToggleSound={()=>{}} lang={lang} onToggleLang={()=>{}} theme={theme} onClearHistory={()=>{}} onClearFavorites={()=>{}} />
      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={(content) => {}} theme={theme} lang={lang} />
    </div>
  );
};

export default App;
