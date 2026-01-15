
import React, { useEffect, useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelGrid } from './components/ChannelGrid';
import { FavoritesBar } from './components/FavoritesBar'; 
import { AiChatPet } from './components/AiChatPet';
import { ScheduleList } from './components/ScheduleList';
import { AlarmModal } from './components/AlarmModal';
import { fetchCountries, fetchChannelsByCountry, fetchRadioStations, fetchGlobalChannelsByCategory, getTimezone, UNIVERSAL_CHANNELS } from './services/iptvService';
import { Country, Channel, AppTheme, Reminder } from './types';
import { Menu, RefreshCw, Shuffle, History, HelpCircle, X, MapPin, AlarmClock, Globe2, Sparkles } from 'lucide-react';

const THEMES: AppTheme[] = [
  {
    id: 'cyber',
    name: '赛博深空',
    type: 'glass',
    styles: {
      bgMain: 'bg-[#030305]', bgSidebar: 'bg-black/40 backdrop-blur-[40px] border-r border-white/5',
      textMain: 'text-white font-sans tracking-tight', textDim: 'text-white/40', border: 'border-white/10',
      card: 'bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50',
      cardHover: 'hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)]', button: 'bg-white/5 hover:bg-white/10 text-white',
      buttonActive: 'bg-gradient-to-br from-cyan-400 to-blue-600 text-black font-black', buttonPrimary: 'bg-white text-black hover:bg-cyan-400',
      input: 'bg-black/40 border-white/10 text-white focus:border-cyan-500/50', font: 'font-sans', layoutShape: 'rounded-[24px]', shadow: 'shadow-2xl', accentColor: '#06b6d4'
    }
  },
  {
    id: 'candy',
    name: '草莓奶油',
    type: 'kids',
    styles: {
      bgMain: 'bg-[#FFF0F3]', bgSidebar: 'bg-white/80 backdrop-blur-xl border-r-4 border-pink-100',
      textMain: 'text-pink-600 font-bold', textDim: 'text-pink-300', border: 'border-pink-100',
      card: 'bg-white border-4 border-pink-50 shadow-[10px_10px_0px_#FFE1E6]',
      cardHover: 'hover:-translate-y-1 hover:shadow-[14px_14px_0px_#FFE1E6]', button: 'bg-white border-2 border-pink-100 text-pink-500',
      buttonActive: 'bg-pink-500 text-white', buttonPrimary: 'bg-pink-400 text-white hover:bg-pink-500',
      input: 'bg-white border-3 border-pink-100 text-pink-600', font: 'font-sans', layoutShape: 'rounded-[36px]', shadow: 'shadow-xl', accentColor: '#F472B6'
    }
  },
  {
    id: 'acid',
    name: '萤光未来',
    type: 'acid',
    styles: {
      bgMain: 'bg-[#000000]', bgSidebar: 'bg-black border-r-4 border-[#bfff00]',
      textMain: 'text-[#bfff00] font-mono uppercase tracking-tighter', textDim: 'text-[#bfff00]/30', border: 'border-[#bfff00]',
      card: 'bg-black border-2 border-[#bfff00] shadow-[6px_6px_0px_#bfff00]',
      cardHover: 'hover:bg-[#bfff00] hover:text-black hover:shadow-[10px_10px_0px_#bfff00]', button: 'bg-black border-2 border-[#bfff00] text-[#bfff00]',
      buttonActive: 'bg-[#bfff00] text-black font-black', buttonPrimary: 'bg-[#bfff00] text-black hover:bg-white hover:border-white',
      input: 'bg-black border-2 border-[#bfff00] text-[#bfff00]', font: 'font-mono', layoutShape: 'rounded-none', shadow: 'none', accentColor: '#bfff00'
    }
  },
  {
    id: 'zen',
    name: '大地呼吸',
    type: 'zen',
    styles: {
      bgMain: 'bg-[#FAF8F5]', bgSidebar: 'bg-[#F2EFE9] border-r border-[#D9D4C7]',
      textMain: 'text-[#3E3A33] font-serif', textDim: 'text-[#A6A08F]', border: 'border-[#D9D4C7]',
      card: 'bg-white border border-[#D9D4C7] shadow-[0_4px_12px_rgba(0,0,0,0.02)]',
      cardHover: 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-0.5', button: 'bg-white border border-[#D9D4C7] text-[#4A453C]',
      buttonActive: 'bg-[#4A453C] text-white shadow-inner', buttonPrimary: 'bg-[#8C8273] text-white hover:bg-[#4A453C]',
      input: 'bg-[#F2EFE9] border border-[#D9D4C7] text-[#4A453C]', font: 'font-serif', layoutShape: 'rounded-xl', shadow: 'shadow-none', accentColor: '#8C8273'
    }
  },
  {
    id: 'retro95',
    name: '复古工位',
    type: 'web95',
    styles: {
      bgMain: 'bg-[#008080]', bgSidebar: 'bg-[#c0c0c0] border-r-2 border-r-black border-t-white border-l-white shadow-[1px_0_0_#fff_inset]',
      textMain: 'text-black font-bold font-mono', textDim: 'text-gray-600', border: 'border-2 border-t-white border-l-white border-b-black border-r-black', 
      card: 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-1',
      cardHover: 'active:scale-[0.97]', button: 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black text-black px-4 py-1 active:border-t-black active:border-l-black active:border-b-white active:border-r-white',
      buttonActive: 'bg-[#c0c0c0] border-2 border-t-black border-l-black border-b-white border-r-white text-black',
      buttonPrimary: 'bg-[#000080] text-white border-2 border-t-white border-l-white border-b-black border-r-black',
      input: 'bg-white border-2 border-t-black border-l-black border-b-white border-r-white text-black px-2', font: 'font-mono', layoutShape: 'rounded-none', shadow: 'none', accentColor: '#000080'
    }
  }
];

const FAVORITES_COUNTRY: Country = { name: '收藏信道', code: 'FAVORITES', languages: [], flag: '🌟' };
const GLOBAL_EXPLORE_COUNTRY: Country = { name: '时空搜索', code: 'GLOBAL_EXPLORE', languages: ['en'], flag: '🛰️' };
const HOT_TAGS = ['新闻', '体育', '电影', '音乐', '中文', '少儿', '探索', '动作', '风景', '喜剧', '经典', '时尚'];

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [history, setHistory] = useState<Channel[]>([]);
  const [localTime, setLocalTime] = useState('--:--:--');
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<'tv' | 'radio'>('tv');
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES[0]);
  const [channelFilter, setChannelFilter] = useState('');
  const [discoveryTag, setDiscoveryTag] = useState<string | null>(null);
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);

  useEffect(() => {
    try {
        const savedFavs = localStorage.getItem('global_favorites');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        const savedReminders = localStorage.getItem('global_reminders');
        if (savedReminders) setReminders(JSON.parse(savedReminders));
        const savedThemeId = localStorage.getItem('app_theme_id');
        if (savedThemeId) {
            const t = THEMES.find(th => th.id === savedThemeId);
            if (t) setCurrentTheme(t);
        }
    } catch (e) { console.error("Storage failed", e); }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const tz = (selectedCountry && selectedCountry.code !== 'GLOBAL') ? getTimezone(selectedCountry.code) : 'UTC';
        setLocalTime(new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: tz }).format(new Date()));
        const nowStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
        const trigger = reminders.find(r => r.timeStr === nowStr);
        if (trigger && !activeAlarm) setActiveAlarm(trigger);
      } catch (e) { setLocalTime('SEARCHING...'); }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCountry, reminders, activeAlarm]);

  useEffect(() => {
    const init = async () => {
      const data = await fetchCountries();
      setCountries([FAVORITES_COUNTRY, ...data]);
      const initialCountry = data.find(c => c.code === 'GLOBAL') || data[0];
      setSelectedCountry(initialCountry);
      setIsAppReady(true);
    };
    init();
  }, []);

  const loadContent = async (refresh = false) => {
    if (!selectedCountry) return;
    setLoadingChannels(true);
    try {
      let data: Channel[] = [];
      if (discoveryTag) {
        data = await fetchGlobalChannelsByCategory(discoveryTag);
      } else {
        data = mode === 'tv' ? await fetchChannelsByCountry(selectedCountry.code, refresh) : await fetchRadioStations(selectedCountry.code, refresh);
      }
      setChannels(data);
      if (data.length > 0 && (!currentChannel || refresh)) {
          const firstAvailable = data.find(c => c.url) || data[0];
          if (!currentChannel) setCurrentChannel(firstAvailable);
      }
    } catch (err) { setChannels([]); }
    finally { setLoadingChannels(false); }
  };

  useEffect(() => { if (isAppReady) loadContent(); }, [selectedCountry, mode, isAppReady, discoveryTag]);

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setHistory(prev => [channel, ...prev.filter(c => c.id !== channel.id)].slice(0, 10));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string) => {
      setDiscoveryTag(discoveryTag === tag ? null : tag);
      setChannelFilter(''); 
  };

  const toggleFavorite = (channel: Channel) => {
    const newFavs = favorites.some(f => f.id === channel.id) ? favorites.filter(f => f.id !== channel.id) : [...favorites, channel];
    setFavorites(newFavs);
    localStorage.setItem('global_favorites', JSON.stringify(newFavs));
  };

  const handleThemeChange = (theme: AppTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('app_theme_id', theme.id);
  };

  if (!isAppReady) return (
    <div className="h-screen w-full bg-[#050508] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Globe2 className="w-6 h-6 text-cyan-500 animate-pulse" />
        </div>
      </div>
      <div className="mt-8 text-cyan-500 font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Initializing Global Uplink</div>
    </div>
  );

  const { styles } = currentTheme;

  return (
    <div className={`flex h-screen w-full ${styles.bgMain} ${styles.font} overflow-hidden relative`}>
      <div className="bg-noise"></div>
      
      {/* Dynamic Mesh Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500 blur-[150px] rounded-full animate-pulse-glow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 blur-[150px] rounded-full animate-pulse-glow" style={{animationDelay: '-2s'}}></div>
      </div>

      <Sidebar 
        countries={countries} selectedCountry={discoveryTag ? GLOBAL_EXPLORE_COUNTRY : selectedCountry} 
        onSelectCountry={(c) => { setDiscoveryTag(null); setSelectedCountry(c); }}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} mode={mode} onModeChange={setMode}
        themes={THEMES} currentTheme={currentTheme} onThemeChange={handleThemeChange}
        favorites={favorites} onSelectFavorite={handleChannelSelect} history={history}
        onImportM3U={() => {}} settings={{enableSound: true}} onToggleSound={() => {}} 
        reminders={reminders} onDeleteReminder={(id) => {
            const next = reminders.filter(r => r.id !== id);
            setReminders(next); localStorage.setItem('global_reminders', JSON.stringify(next));
        }} onPlayReminder={handleChannelSelect}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
        <header className={`shrink-0 px-8 py-4 flex items-center justify-between border-b ${styles.border} ${styles.bgSidebar} backdrop-blur-[60px] z-30 shadow-lg`}>
            <div className="flex items-center gap-6">
                <button onClick={() => setSidebarOpen(true)} className={`md:hidden p-3 rounded-full ${styles.card} ${styles.textMain} active:scale-90 transition-transform`}><Menu className="w-6 h-6" /></button>
                <div className="flex items-center gap-4">
                    <span className="text-3xl drop-shadow-2xl filter saturate-150">{discoveryTag ? '🛰️' : selectedCountry?.flag}</span>
                    <div className="flex flex-col">
                        <h1 className={`text-xl font-black uppercase italic tracking-tighter leading-none ${styles.textMain}`}>
                            {discoveryTag ? `全球探索: ${discoveryTag}` : selectedCountry?.name}
                        </h1>
                        <span className={`text-[9px] font-black tracking-widest uppercase opacity-40 mt-1 ${styles.textDim}`}>
                            {channels.length} Nodes Connected
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className={`hidden lg:flex flex-col items-end gap-0.5`}>
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${styles.textDim}`}>Local Node Time</span>
                    <span className={`text-sm font-mono font-bold tracking-widest ${styles.textMain}`}>{localTime}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowSchedule(true)} className={`p-3 rounded-xl ${styles.button} hover:scale-105 active:scale-95 transition-all relative`}>
                        <AlarmClock className="w-5 h-5" />
                        {reminders.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-black animate-ping"></span>}
                    </button>
                    <button onClick={() => loadContent(true)} className={`p-3 rounded-xl ${styles.button} hover:rotate-180 transition-all duration-700 ${loadingChannels ? 'animate-spin' : ''}`}><RefreshCw className="w-5 h-5" /></button>
                </div>
            </div>
        </header>

        <div className={`flex-1 overflow-y-auto ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`}>
            <div className="px-6 py-8 max-w-[1920px] mx-auto">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 min-w-0 space-y-8">
                        <section className="space-y-6">
                            <div className={`flex items-center justify-between px-6 py-3 ${styles.card} ${styles.layoutShape} border ${styles.border} group`}>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 text-cyan-400" />
                                        <div className="absolute inset-0 bg-cyan-400/40 blur-md animate-pulse"></div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${styles.textMain}`}>
                                        {discoveryTag ? `Scanning Global Metadata for "${discoveryTag}"` : `Active Link: ${selectedCountry?.name} Ground Station`}
                                    </span>
                                </div>
                                {discoveryTag && (
                                    <button onClick={() => setDiscoveryTag(null)} className="text-[10px] font-black uppercase text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 px-3 py-1 rounded-full transition-all">Exit Search</button>
                                )}
                            </div>
                            
                            <VideoPlayer 
                              channel={currentChannel} country={discoveryTag ? GLOBAL_EXPLORE_COUNTRY : selectedCountry} theme={currentTheme}
                              isFavorite={!!currentChannel && favorites.some(f => f.id === currentChannel.id)}
                              onToggleFavorite={() => currentChannel && toggleFavorite(currentChannel)} 
                              onAutoSkip={() => {
                                  if (channels.length > 1) {
                                      const next = channels[Math.floor(Math.random()*channels.length)];
                                      handleChannelSelect(next);
                                  }
                              }}
                            />
                            
                            <FavoritesBar favorites={favorites} currentChannel={currentChannel} onSelectChannel={handleChannelSelect} theme={currentTheme} mode={mode} />
                        </section>

                        <section className="pt-4 space-y-8">
                            <div className="flex flex-col space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-1.5 h-8 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]`}></div>
                                        <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${styles.textMain}`}>
                                            Discovery Library
                                        </h2>
                                    </div>
                                    <div className={`hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] font-black uppercase text-white/30`}>
                                        <Sparkles className="w-3 h-3" /> Filter by Intent
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2.5">
                                    {HOT_TAGS.map(tag => (
                                        <button 
                                            key={tag} 
                                            onClick={() => handleTagClick(tag)} 
                                            className={`px-4 py-2 ${styles.layoutShape} text-[10px] font-black border transition-all duration-300 transform active:scale-90 ${discoveryTag === tag ? styles.buttonActive : `${styles.button} opacity-40 hover:opacity-100 hover:scale-105`}`}
                                        >
                                            # {tag}
                                        </button>
                                    ))}
                                    {(discoveryTag || channelFilter) && (
                                        <button onClick={() => { setDiscoveryTag(null); setChannelFilter(''); }} className="px-5 py-2 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">RESET FILTERS</button>
                                    )}
                                </div>
                            </div>
                            
                            <ChannelGrid 
                                channels={channels} currentChannel={currentChannel} onSelectChannel={handleChannelSelect} 
                                loading={loadingChannels} mode={mode} theme={currentTheme} favorites={favorites} 
                                onToggleFavorite={toggleFavorite} externalFilter={channelFilter} onExternalFilterChange={setChannelFilter}
                            />
                        </section>
                    </div>

                    <div className="lg:w-[360px] shrink-0 space-y-6">
                        <div className="lg:sticky lg:top-8 space-y-6">
                            <div className={`${styles.card} p-6 ${styles.layoutShape} border ${styles.border} group overflow-hidden relative`}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-40 flex items-center gap-3"><History className="w-4 h-4" /> Temporal Logs</h3>
                                <div className="space-y-3">
                                    {history.length > 0 ? history.map(h => (
                                        <div key={h.id} onClick={() => handleChannelSelect(h)} className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 cursor-pointer group/item transition-all border border-transparent hover:border-white/5`}>
                                            <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover/item:scale-110 transition-transform">
                                                {h.logo ? <img src={h.logo} className="w-full h-full object-contain p-1.5" /> : <History className="w-4 h-4 opacity-10" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-[11px] font-black uppercase truncate ${styles.textMain}`}>{h.name}</span>
                                                <span className={`text-[8px] font-bold opacity-30 uppercase tracking-tighter`}>{h.group || 'Public Wave'}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center text-[9px] font-black opacity-10 uppercase italic">History empty</div>
                                    )}
                                </div>
                            </div>
                            
                            <button onClick={() => { if(channels.length > 0) handleChannelSelect(channels[Math.floor(Math.random()*channels.length)]) }} className={`w-full py-5 ${styles.buttonPrimary} ${styles.layoutShape} font-black uppercase text-[11px] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] active:translate-y-[2px] transition-all`}><Shuffle className="w-4 h-4" /> Neural Randomize</button>
                            
                            <AiChatPet theme={currentTheme} currentChannels={channels} onSelectChannel={handleChannelSelect} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <ScheduleList 
        reminders={reminders} isOpen={showSchedule} onClose={() => setShowSchedule(false)} 
        onDelete={(id) => { const next = reminders.filter(r => r.id !== id); setReminders(next); localStorage.setItem('global_reminders', JSON.stringify(next)); }}
        theme={currentTheme} onPlayChannel={(id) => { const ch = channels.find(c => c.id === id); if(ch) handleChannelSelect(ch); }}
        allChannels={channels}
      />
      <AlarmModal reminder={activeAlarm} onClose={() => setActiveAlarm(null)} onWatch={(id) => { const ch = channels.find(c => c.id === id); if(ch) handleChannelSelect(ch); setActiveAlarm(null); }} theme={currentTheme} />
    </div>
  );
};

export default App;
