
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelGrid } from './components/ChannelGrid';
import { FavoritesBar } from './components/FavoritesBar'; 
import { AiChatPet } from './components/AiChatPet';
import { SettingsModal } from './components/SettingsModal';
import { ImportModal } from './components/ImportModal';
import { fetchCountries, fetchChannelsByCountry, fetchRadioStations, fetchGlobalChannelsByCategory, getTimezone, GLOBAL_COUNTRY, parseM3U } from './services/iptvService';
import { Country, Channel, AppTheme, Reminder, Language, AppSettings } from './types';
import { Menu, RefreshCw, Shuffle, Globe, Loader2, Sparkles, Clock, Hash, Zap, X } from 'lucide-react';

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
      input: 'bg-black/40 border-white/10 text-white', font: 'font-sans', layoutShape: 'rounded-[1.5rem] md:rounded-[2rem]', shadow: 'shadow-2xl', accentColor: 'text-cyan-400'
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
  },
  {
    id: 'acid',
    name: { zh: '酸性未来', en: 'Acid' },
    type: 'acid',
    styles: {
      bgMain: 'bg-aurora-acid', bgSidebar: 'bg-black/80 border-r border-[#ccff00]/20',
      textMain: 'text-[#ccff00]', textDim: 'text-[#ccff00]/40', border: 'border-[#ccff00]/10',
      card: 'bg-black border border-[#ccff00]/20 hover:border-[#ccff00]',
      cardHover: 'hover:shadow-[0_0_30px_rgba(204,255,0,0.2)]', button: 'bg-[#ccff00]/10 text-[#ccff00]',
      buttonActive: 'bg-[#ccff00] text-black font-black', buttonPrimary: 'bg-[#ccff00] text-black',
      input: 'bg-black border-[#ccff00]/30 text-[#ccff00]', font: 'font-mono', layoutShape: 'rounded-none', shadow: 'shadow-none', accentColor: 'text-[#ccff00]'
    }
  }
];

const DISCOVERY_TAGS = ['新闻', '体育', '电影', '少儿', '音乐', '纪实'];

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
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      if (!selectedCountry) return;
      const tz = getTimezone(selectedCountry.code);
      try {
        const time = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
          timeZone: tz,
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(new Date());
        setLocalTime(time);
      } catch (e) { setLocalTime('--:--:--'); }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCountry, lang]);

  useEffect(() => {
    const init = async () => {
      // 优化加载：如果 API 响应慢，优先进入 Ready 状态展示默认内容
      const initTimer = setTimeout(() => setIsReady(true), 2500);
      try {
        const data = await fetchCountries();
        setCountries(data);
        if (!selectedCountry) setSelectedCountry(data[0] || GLOBAL_COUNTRY);
        
        const savedFavs = localStorage.getItem('looq_favs');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
      } catch (e) { console.error(e); }
      clearTimeout(initTimer);
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
        // 如果没有当前播放频道，默认播放列表第一个
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

  const handleRandomPlay = () => {
    if (channels.length === 0) return;
    const randomIdx = Math.floor(Math.random() * channels.length);
    setCurrentChannel(channels[randomIdx]);
  };

  if (!isReady) return (
    <div className="h-screen w-full bg-[#050508] flex flex-col items-center justify-center">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <Globe className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/50 animate-pulse">Syncing Galaxy...</span>
    </div>
  );

  return (
    <div className={`flex h-screen w-full ${theme.styles.bgMain} ${theme.styles.font} overflow-hidden relative transition-colors duration-1000`}>
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

      <main className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
        <header className={`px-4 md:px-8 py-2 md:py-4 flex items-center justify-between border-b ${theme.styles.border} ${theme.styles.bgSidebar} transition-all shrink-0`}>
            <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-white/80"><Menu className="w-5 h-5" /></button>
                <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-5 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xl md:text-2xl leading-none">{selectedCountry?.flag}</span>
                        <h1 className={`text-[11px] md:text-lg font-black uppercase tracking-tighter truncate ${theme.styles.textMain}`}>
                            {discoveryTag || selectedCountry?.name}
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Clock className="w-2.5 h-2.5 text-cyan-400" />
                        <span className="text-[9px] md:text-[11px] font-mono font-black tracking-widest text-white">{localTime}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleRandomPlay} className={`p-1.5 md:p-2 rounded-lg ${theme.styles.button} hover:text-cyan-400 transition-colors`}>
                    <Shuffle className="w-3.5 h-3.5 md:w-4 h-4" />
                </button>
                <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="text-[8px] md:text-[10px] font-black text-white/20 hover:text-white/60 uppercase px-1">
                    {lang === 'zh' ? 'EN' : 'CN'}
                </button>
                <button onClick={() => loadChannels()} className={`p-1.5 md:p-2 rounded-lg ${theme.styles.button} ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw className="w-3.5 h-3.5 md:w-4 h-4" />
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-10 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar snap-x">
                    <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/10 mr-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400 opacity-60" />
                    </div>
                    {DISCOVERY_TAGS.map(tag => (
                        <button 
                            key={tag} 
                            onClick={() => { setDiscoveryTag(tag); setSelectedCountry(GLOBAL_COUNTRY); }}
                            className={`px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border snap-start ${discoveryTag === tag ? 'bg-cyan-500 text-black border-transparent' : `bg-white/5 ${theme.styles.textDim} border-white/5`}`}
                        >
                            {tag}
                        </button>
                    ))}
                    {discoveryTag && (
                        <button onClick={() => setDiscoveryTag(null)} className="p-1 text-rose-400 hover:scale-110 shrink-0"><X className="w-3.5 h-3.5" /></button>
                    )}
                </div>

                <section className="space-y-3">
                    <div className="max-w-4xl lg:max-w-5xl mx-auto w-full">
                        <VideoPlayer 
                            channel={currentChannel} country={selectedCountry} theme={theme}
                            isFavorite={!!currentChannel && favorites.some(f => f.id === currentChannel.id)}
                            onToggleFavorite={() => currentChannel && toggleFavorite(currentChannel)}
                            lang={lang}
                            onRandom={handleRandomPlay}
                        />
                    </div>
                    <div className="max-w-4xl lg:max-w-5xl mx-auto w-full">
                        <FavoritesBar favorites={favorites} currentChannel={currentChannel} onSelectChannel={setCurrentChannel} theme={theme} mode={mode} />
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <h2 className={`text-[9px] md:text-sm font-black uppercase tracking-widest ${theme.styles.textMain}`}>
                                {lang === 'zh' ? '链路波段扫描' : 'UPLINK SCAN'}
                            </h2>
                        </div>
                    </div>
                    <ChannelGrid 
                        channels={channels} currentChannel={currentChannel} onSelectChannel={setCurrentChannel}
                        loading={loading} mode={mode} theme={theme} favorites={favorites} onToggleFavorite={toggleFavorite}
                    />
                </section>

                <section className="flex justify-end pt-8 pb-20 md:pb-24">
                    <AiChatPet theme={theme} currentChannels={channels} onSelectChannel={setCurrentChannel} lang={lang} />
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
