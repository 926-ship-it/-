
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelGrid } from './components/ChannelGrid';
import { FavoritesBar } from './components/FavoritesBar'; 
import { AiChatPet } from './components/AiChatPet';
import { fetchCountries, fetchChannelsByCountry, fetchRadioStations, getTimezone } from './services/iptvService';
import { Country, Channel, AppTheme, Reminder, AppSettings } from './types';
import { Menu, RefreshCw, Clock, Shuffle, History, ChevronRight, Tv } from 'lucide-react';

const THEMES: AppTheme[] = [
  {
    id: 'cyber',
    name: '赛博极客',
    type: 'glass',
    styles: {
      bgMain: 'bg-[#050508]', 
      bgSidebar: 'bg-black/40 backdrop-blur-3xl border-r border-white/5',
      textMain: 'text-white font-sans tracking-tight',
      textDim: 'text-gray-500',
      border: 'border-white/10',
      card: 'bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 transition-all duration-500',
      cardHover: 'hover:shadow-[0_0_40px_rgba(6,182,212,0.1)] hover:-translate-y-0.5',
      button: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
      buttonActive: 'bg-cyan-500 text-black font-black shadow-[0_0_20px_rgba(6,182,212,0.4)]',
      buttonPrimary: 'bg-white text-black hover:bg-cyan-400 transition-colors font-black',
      input: 'bg-white/5 border-white/10 text-white focus:border-cyan-500/50',
      font: 'font-sans',
      layoutShape: 'rounded-2xl',
      shadow: 'shadow-2xl',
      accentColor: '#06b6d4'
    }
  },
  {
    id: 'candy',
    name: '草莓软糖',
    type: 'kids',
    styles: {
      bgMain: 'bg-[#FFF5F7]', 
      bgSidebar: 'bg-white border-r-4 border-pink-100',
      textMain: 'text-pink-600 font-bold',
      textDim: 'text-pink-300',
      border: 'border-pink-100',
      card: 'bg-white border-4 border-pink-50 shadow-[8px_8px_0px_#FFE4E8]',
      cardHover: 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none',
      button: 'bg-white border-2 border-pink-100 text-pink-500',
      buttonActive: 'bg-pink-500 text-white shadow-lg',
      buttonPrimary: 'bg-pink-400 text-white hover:bg-pink-500 font-black',
      input: 'bg-pink-50/30 border-2 border-pink-100 text-pink-600',
      font: 'font-sans',
      layoutShape: 'rounded-[32px]',
      shadow: 'shadow-xl',
      accentColor: '#F472B6'
    }
  },
  {
    id: 'acid',
    name: '酸性流行',
    type: 'acid',
    styles: {
      bgMain: 'bg-[#000000]', 
      bgSidebar: 'bg-[#000000] border-r-2 border-[#bfff00]',
      textMain: 'text-[#bfff00] font-mono uppercase tracking-tighter',
      textDim: 'text-[#bfff00]/40',
      border: 'border-[#bfff00]',
      card: 'bg-black border-2 border-[#bfff00] shadow-[4px_4px_0px_#bfff00]',
      cardHover: 'hover:bg-[#bfff00] hover:text-black',
      button: 'bg-black border border-[#bfff00] text-[#bfff00]',
      buttonActive: 'bg-[#bfff00] text-black font-black',
      buttonPrimary: 'bg-[#bfff00] text-black hover:invert font-black',
      input: 'bg-black border-2 border-[#bfff00] text-[#bfff00]',
      font: 'font-mono',
      layoutShape: 'rounded-none',
      shadow: 'none',
      accentColor: '#bfff00'
    }
  },
  {
    id: 'zen',
    name: '禅意留白',
    type: 'zen',
    styles: {
      bgMain: 'bg-[#F9F7F2]', 
      bgSidebar: 'bg-[#F2EFE9] border-r border-[#D9D4C7]',
      textMain: 'text-[#4A453C] font-serif',
      textDim: 'text-[#A6A08F]',
      border: 'border-[#D9D4C7]',
      card: 'bg-white border border-[#D9D4C7] shadow-sm',
      cardHover: 'hover:shadow-md transition-shadow',
      button: 'bg-white border border-[#D9D4C7] text-[#4A453C]',
      buttonActive: 'bg-[#4A453C] text-white',
      buttonPrimary: 'bg-[#8C8273] text-white hover:bg-[#4A453C]',
      input: 'bg-[#F2EFE9] border border-[#D9D4C7] text-[#4A453C]',
      font: 'font-serif',
      layoutShape: 'rounded-lg',
      shadow: 'shadow-none',
      accentColor: '#8C8273'
    }
  },
  {
    id: 'retro95',
    name: '极客 1995',
    type: 'web95',
    styles: {
      bgMain: 'bg-[#008080]', 
      bgSidebar: 'bg-[#c0c0c0] border-r-2 border-r-black border-t-white border-l-white',
      textMain: 'text-black font-bold',
      textDim: 'text-gray-700',
      border: 'border-2 border-t-white border-l-white border-b-black border-r-black', 
      card: 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black',
      cardHover: 'active:scale-[0.98]',
      button: 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black text-black',
      buttonActive: 'bg-[#c0c0c0] border-2 border-t-black border-l-black border-b-white border-r-white text-black',
      buttonPrimary: 'bg-[#000080] text-white border-2 border-t-white border-l-white border-b-black border-r-black',
      input: 'bg-white border-2 border-t-black border-l-black border-b-white border-r-white text-black',
      font: 'font-mono',
      layoutShape: 'rounded-none',
      shadow: 'none',
      accentColor: '#000080'
    }
  }
];

const FAVORITES_COUNTRY: Country = { name: '我的收藏', code: 'FAVORITES', languages: [], flag: '⭐' };

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [history, setHistory] = useState<Channel[]>([]);
  const [localTime, setLocalTime] = useState('');
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<'tv' | 'radio'>('tv');
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      const tz = (selectedCountry && selectedCountry.code !== 'GLOBAL') ? getTimezone(selectedCountry.code) : 'UTC';
      setLocalTime(new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: tz }).format(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCountry]);

  useEffect(() => {
    const init = async () => {
      const data = await fetchCountries();
      setCountries([FAVORITES_COUNTRY, ...data]);
      const initial = data.find(c => c.code === 'GLOBAL') || data[0];
      setSelectedCountry(initial);
      const savedFavs = localStorage.getItem('global_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      setIsAppReady(true);
    };
    init();
  }, []);

  const loadContent = async (refresh = false) => {
    if (!selectedCountry) return;
    setLoadingChannels(true);
    try {
      const data = mode === 'tv' 
        ? await fetchChannelsByCountry(selectedCountry.code, refresh)
        : await fetchRadioStations(selectedCountry.code, refresh);
      setChannels(data);
      if (data.length > 0 && !currentChannel) setCurrentChannel(data[0]);
    } catch (err) {
      setChannels([]);
    } finally { setLoadingChannels(false); }
  };

  useEffect(() => { if (isAppReady) loadContent(); }, [selectedCountry, mode, isAppReady]);

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setHistory(prev => [channel, ...prev.filter(c => c.id !== channel.id)].slice(0, 10));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRandomSkip = () => {
    if (channels.length > 0) handleChannelSelect(channels[Math.floor(Math.random() * channels.length)]);
  };

  if (!isAppReady) return (
    <div className="h-screen w-full bg-[#050508] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
      <div className="text-cyan-500 font-mono text-xs animate-pulse tracking-[0.3em] uppercase">初始化信号中...</div>
    </div>
  );

  const { styles } = currentTheme;

  return (
    <div className={`flex h-screen w-full ${styles.bgMain} ${styles.font} overflow-hidden relative`}>
      <div className="bg-noise"></div>

      <Sidebar 
        countries={countries} selectedCountry={selectedCountry} onSelectCountry={setSelectedCountry}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} mode={mode} onModeChange={setMode}
        themes={THEMES} currentTheme={currentTheme} onThemeChange={setCurrentTheme}
        favorites={favorites} onSelectFavorite={handleChannelSelect} history={history}
        onImportM3U={() => {}} settings={{enableSound: true}} onToggleSound={() => {}} reminders={[]}
        onDeleteReminder={() => {}} onPlayReminder={() => {}}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
        <header className={`shrink-0 px-6 py-3 flex items-center justify-between border-b ${styles.border} ${styles.bgSidebar} backdrop-blur-3xl z-20`}>
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className={`md:hidden p-2 rounded-xl ${styles.textMain}`}><Menu className="w-6 h-6" /></button>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedCountry?.flag}</span>
                    <h1 className={`text-lg font-black uppercase italic tracking-tighter ${styles.textMain}`}>{selectedCountry?.name}</h1>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className={`hidden sm:flex items-center gap-2 ${styles.card} px-3 py-1.5 ${styles.layoutShape} text-[10px]`}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-cyan-500"></div>
                    <span className={`font-mono ${styles.textMain}`}>{localTime}</span>
                </div>
                <button onClick={() => loadContent(true)} className={`p-2 rounded-full ${styles.textMain} ${loadingChannels ? 'animate-spin' : ''}`}>
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
        </header>

        <div className={`flex-1 overflow-y-auto ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`}>
            <div className="px-4 md:px-6 py-6 max-w-[1600px] mx-auto">
                <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* 左侧主展示区 (约 70% 宽度) */}
                    <div className="flex-1 min-w-0 space-y-6">
                        <section className="space-y-4">
                            <VideoPlayer 
                              channel={currentChannel} country={selectedCountry} theme={currentTheme}
                              isFavorite={!!currentChannel && favorites.some(f => f.id === currentChannel.id)}
                              onToggleFavorite={() => {}} onAutoSkip={handleRandomSkip}
                            />
                            <FavoritesBar favorites={favorites} currentChannel={currentChannel} onSelectChannel={handleChannelSelect} theme={currentTheme} mode={mode} />
                        </section>

                        <section className="pt-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-cyan-500 rounded-full"></div>
                                    <h2 className={`text-lg font-black uppercase italic tracking-tight ${styles.textMain}`}>频道资源目录 ({channels.length})</h2>
                                </div>
                            </div>
                            <ChannelGrid 
                                channels={channels} currentChannel={currentChannel} 
                                onSelectChannel={handleChannelSelect} loading={loadingChannels}
                                mode={mode} theme={currentTheme} favorites={favorites} onToggleFavorite={() => {}}
                            />
                        </section>
                    </div>

                    {/* 右侧功能挂件区 (约 30% 宽度) */}
                    <div className="lg:w-[320px] shrink-0 space-y-4">
                        <div className="lg:sticky lg:top-4 space-y-4">
                            <div className={`${styles.card} p-5 ${styles.layoutShape}`}>
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 opacity-40 flex items-center gap-2">
                                    <History className="w-3 h-3" /> 播放足迹 (最近10条)
                                </h3>
                                <div className="space-y-2">
                                    {history.map(h => (
                                        <div key={h.id} onClick={() => handleChannelSelect(h)} className={`flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer rounded-xl group transition-all border border-transparent hover:border-white/5`}>
                                            <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                                                {h.logo ? <img src={h.logo} className="w-full h-full object-contain" /> : <Tv className="w-3.5 h-3.5 opacity-20" />}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase truncate ${styles.textMain}`}>{h.name}</span>
                                        </div>
                                    ))}
                                    {history.length === 0 && <p className="text-[10px] opacity-20 italic text-center py-4">收视记录空空如也</p>}
                                </div>
                            </div>
                            
                            <button onClick={handleRandomSkip} className={`w-full py-4 ${styles.buttonPrimary} ${styles.layoutShape} font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl`}>
                                <Shuffle className="w-3.5 h-3.5" /> 随机跳台漫游
                            </button>

                            {/* AI 智播助手已整合到此，紧跟随机漫游 */}
                            <AiChatPet theme={currentTheme} currentChannels={channels} onSelectChannel={handleChannelSelect} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
