
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
// Added X to the import list to fix "Cannot find name 'X'" error
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

  // 实时当地时间逻辑
  useEffect(() => {
    const timer = setInterval(() => {
      if (!selectedCountry) return;
      const tz = getTimezone(selectedCountry.code);
      try {
        const time = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(new Date());
        setLocalTime(time);
      } catch (e) {
        setLocalTime('--:--:--');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCountry, lang]);

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
        if (data.length > 0 && !currentChannel) setCurrentChannel(data[Math.floor(Math.random() * data.length)]);
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

      <main className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
        <header className={`px-4 md:px-8 py-2 md:py-4 flex items-center justify-between border-b ${theme.styles.border} ${theme.styles.bgSidebar} transition-all shrink-0`}>
            <div className="flex items-center gap-3 md:gap-6 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 text-white/80"><Menu className="w-5 h-5" /></button>
                <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-5 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xl md:text-2xl shrink-0 leading-none">{selectedCountry?.flag}</span>
                        <h1 className={`text-[11px] md:text-lg font-black uppercase tracking-tighter truncate ${theme.styles.textMain}`}>
                            {discoveryTag || selectedCountry?.name}
                        </h1>
                    </div>
                    {/* 当地时间 - 手机端紧凑显示 */}
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-cyan-400" />
                        <span className="text-[9px] md:text-[11px] font-mono font-black tracking-widest text-white">{localTime}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <button 
                  onClick={handleRandomPlay} 
                  title={lang === 'zh' ? '随机播放' : 'Random Play'}
                  className={`p-1.5 md:p-2 rounded-lg ${theme.styles.button} hover:text-cyan-400 transition-colors`}
                >
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

        <div className="flex-1 overflow-y-auto p-3 md:p-10 scrollbar-thin scroll-smooth no-scrollbar md:scrollbar-auto">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
                {/* 发现标签条 - 增强移动端存在感 */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar snap-x">
                    <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/10 mr-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400 opacity-60" />
                    </div>
                    {DISCOVERY_TAGS.map(tag => (
                        <button 
                            key={tag} 
                            onClick={() => { setDiscoveryTag(tag); setSelectedCountry(GLOBAL_COUNTRY); }}
                            className={`px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border snap-start ${discoveryTag === tag ? 'bg-cyan-500 text-black border-transparent shadow-lg shadow-cyan-500/20' : `bg-white/5 ${theme.styles.textDim} border-white/5 hover:border-white/20`}`}
                        >
                            {tag}
                        </button>
                    ))}
                    {discoveryTag && (
                        <button onClick={() => setDiscoveryTag(null)} className="p-1 text-rose-400 hover:scale-110 transition-transform shrink-0"><X className="w-3.5 h-3.5" /></button>
                    )}
                </div>

                <section className="space-y-3">
                    {/* 优化大屏播放器占比：限制宽度并居中，增加纵深感 */}
                    <div className="max-w-4xl lg:max-w-5xl mx-auto w-full group/player">
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
                        <span className="text-[8px] md:text-[10px] font-black opacity-10 uppercase tracking-[0.2em]">{channels.length} NODES AVAILABLE</span>
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
