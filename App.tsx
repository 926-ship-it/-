
import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelGrid } from './components/ChannelGrid';
import { FavoritesBar } from './components/FavoritesBar'; 
import { AiChatPet } from './components/AiChatPet';
import { ScheduleList } from './components/ScheduleList';
import { AlarmModal } from './components/AlarmModal';
import { SettingsModal } from './components/SettingsModal';
import { fetchCountries, fetchChannelsByCountry, fetchRadioStations, fetchGlobalChannelsByCategory, getTimezone, GLOBAL_COUNTRY } from './services/iptvService';
import { Country, Channel, AppTheme, Reminder, Language, AppSettings } from './types';
import { Menu, RefreshCw, Shuffle, History, AlarmClock, Sparkles, Languages, Loader2 } from 'lucide-react';

const THEMES: AppTheme[] = [
  {
    id: 'cyber',
    name: { zh: '赛博霓虹', en: 'Cyber' },
    type: 'glass',
    styles: {
      bgMain: 'bg-aurora-cyber', bgSidebar: 'bg-black/40 backdrop-blur-[80px] border-r border-white/5',
      textMain: 'text-white font-sans tracking-tight', textDim: 'text-cyan-400/50', border: 'border-white/10',
      card: 'glass-card hover:border-cyan-500/40 transition-all duration-500',
      cardHover: 'hover:shadow-[0_0_50px_rgba(6,182,212,0.2)] hover:-translate-y-1', button: 'bg-white/5 hover:bg-white/10 text-white',
      buttonActive: 'bg-cyan-500 text-black font-black shadow-[0_0_30px_rgba(6,182,212,0.5)]', buttonPrimary: 'bg-cyan-400 text-black hover:bg-white',
      input: 'bg-black/40 border-white/10 text-white focus:border-cyan-500', font: 'font-sans', layoutShape: 'rounded-[2rem]', shadow: 'shadow-2xl', accentColor: 'text-cyan-400'
    }
  },
  {
    id: 'candy',
    name: { zh: '梦幻马卡龙', en: 'Macaron' },
    type: 'kids',
    styles: {
      bgMain: 'bg-aurora-candy', bgSidebar: 'bg-white/60 backdrop-blur-3xl border-r border-rose-100',
      textMain: 'text-rose-600 font-bold font-sans', textDim: 'text-rose-300', border: 'border-rose-100',
      card: 'bg-white/80 border-none shadow-[0_20px_40px_rgba(244,63,94,0.08)]',
      cardHover: 'hover:scale-105 active:scale-95', button: 'bg-rose-50 text-rose-500',
      buttonActive: 'bg-rose-500 text-white font-black shadow-lg', buttonPrimary: 'bg-rose-400 text-white hover:bg-rose-500',
      input: 'bg-white/60 border-2 border-rose-100 text-rose-600', font: 'font-sans', layoutShape: 'rounded-[3rem]', shadow: 'shadow-2xl', accentColor: 'text-rose-400'
    }
  },
  {
    id: 'synth',
    name: { zh: '幻紫呼吸', en: 'Synthwave' },
    type: 'glass',
    styles: {
      bgMain: 'bg-aurora-synth', bgSidebar: 'bg-[#0a001a]/60 backdrop-blur-[60px] border-r border-[#ff00ff]/10',
      textMain: 'text-[#00ffff] font-sans tracking-widest text-glow', textDim: 'text-[#ff00ff]/40', border: 'border-[#ff00ff]/10',
      card: 'bg-[#1a0033]/40 border border-[#ff00ff]/5 hover:border-[#ff00ff]/40',
      cardHover: 'hover:shadow-[0_0_60px_rgba(255,0,255,0.1)]', button: 'bg-[#330066]/50 text-[#00ffff]',
      buttonActive: 'bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black font-black', buttonPrimary: 'bg-[#ff00ff] text-white',
      input: 'bg-[#0a001a]/40 border-[#ff00ff]/20 text-[#00ffff]', font: 'font-sans', layoutShape: 'rounded-2xl', shadow: 'shadow-2xl', accentColor: 'text-[#ff00ff]'
    }
  },
  {
    id: 'acid',
    name: { zh: '酸性科技', en: 'Acid' },
    type: 'acid',
    styles: {
      bgMain: 'bg-aurora-acid', bgSidebar: 'bg-black border-r-2 border-[#ccff00]',
      textMain: 'text-[#ccff00] font-mono tracking-tighter uppercase italic', textDim: 'text-[#ccff00]/30', border: 'border-[#ccff00]/20',
      card: 'bg-black border-2 border-[#ccff00]/10 hover:border-[#ccff00]',
      cardHover: 'hover:bg-[#ccff00] hover:text-black', button: 'bg-black text-[#ccff00] border border-[#ccff00]',
      buttonActive: 'bg-[#ccff00] text-black font-black', buttonPrimary: 'bg-[#ccff00] text-black',
      input: 'bg-black border-2 border-[#ccff00]/40 text-[#ccff00]', font: 'font-mono', layoutShape: 'rounded-none', shadow: 'shadow-none', accentColor: 'text-[#ccff00]'
    }
  },
  {
    id: 'zen',
    name: { zh: '极简禅意', en: 'Zen' },
    type: 'zen',
    styles: {
      bgMain: 'bg-aurora-zen', bgSidebar: 'bg-white/40 backdrop-blur-xl border-r border-gray-200',
      textMain: 'text-gray-900 font-serif tracking-tight', textDim: 'text-gray-400', border: 'border-gray-200',
      card: 'bg-white/60 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-1000',
      cardHover: 'hover:-translate-y-1', button: 'bg-gray-50 text-gray-600',
      buttonActive: 'bg-gray-900 text-white font-medium', buttonPrimary: 'bg-gray-800 text-white',
      input: 'bg-white/80 border-gray-200 text-gray-900', font: 'font-serif', layoutShape: 'rounded-sm', shadow: 'shadow-sm', accentColor: 'text-gray-500'
    }
  },
  {
    id: 'senior',
    name: { zh: '大字长辈', en: 'Senior' },
    type: 'senior',
    styles: {
      bgMain: 'bg-blue-900', bgSidebar: 'bg-blue-800 border-r-4 border-yellow-400',
      textMain: 'text-white font-bold text-xl', textDim: 'text-white/60 text-lg', border: 'border-white/20',
      card: 'bg-blue-700 border-4 border-white/10 hover:border-yellow-400',
      cardHover: 'hover:scale-105 active:scale-95', button: 'bg-blue-600 text-white text-lg py-4',
      buttonActive: 'bg-yellow-400 text-blue-900 font-black text-2xl px-10', buttonPrimary: 'bg-yellow-400 text-blue-900 px-8',
      input: 'bg-white text-blue-900 text-2xl h-20 px-8', font: 'font-sans', layoutShape: 'rounded-xl', shadow: 'shadow-2xl', accentColor: 'text-yellow-400'
    }
  }
];

const FAVORITES_COUNTRY: Country = { name: '我的频道', code: 'FAVORITES', languages: [], flag: '💖' };
const GLOBAL_EXPLORE_COUNTRY: Country = { name: '星际搜索', code: 'GLOBAL_EXPLORE', languages: ['en'], flag: '🛰️' };
const HOT_TAGS = ['新闻', '体育', '电影', '音乐', '少儿', '探索', '时尚', '景观', '经典'];

const TRANSLATIONS = {
  zh: {
    loading: '正在扫描全球卫星...',
    nodesSynchronized: '个信道在线',
    nodeTime: '轨道同步时间',
    discoveryTerminal: 'AI 智能探索',
    activityLog: '最近浏览',
    logsEmpty: '暂无历史记录',
    randomStation: '随机换台',
    reset: '重置',
    favoritesTitle: '收藏夹',
    global: '全球'
  },
  en: {
    loading: 'Scanning Satellites...',
    nodesSynchronized: 'Channels Online',
    nodeTime: 'Orbital Time',
    discoveryTerminal: 'AI Discovery',
    activityLog: 'Recent Logs',
    logsEmpty: 'No history',
    randomStation: 'Shuffle',
    reset: 'RESET',
    favoritesTitle: 'Saved',
    global: 'Global'
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('app_lang') as Language) || 'zh');
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
  const [showSettings, setShowSettings] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : { enableSound: true };
  });

  const t = TRANSLATIONS[lang];

  // 换台音效逻辑：使用 Web Audio API 生成具有科技感的切波声
  const playSwitchSound = useCallback(() => {
    if (!settings.enableSound) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // 模拟“数字锁定”音效：高频滑向低频
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      
      // 自动关闭上下文释放资源
      setTimeout(() => ctx.close(), 200);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }, [settings.enableSound]);

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetchCountries();
        const globalNode = data.find(c => c.code === 'GLOBAL') || GLOBAL_COUNTRY;
        setCountries([FAVORITES_COUNTRY, ...data]);
        
        const savedThemeId = localStorage.getItem('app_theme_id');
        if (savedThemeId) {
            const th = THEMES.find(th => th.id === savedThemeId);
            if (th) setCurrentTheme(th);
        }
        
        setSelectedCountry(globalNode);
        
        const savedFavs = localStorage.getItem('global_favorites');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        const savedReminders = localStorage.getItem('global_reminders');
        if (savedReminders) setReminders(JSON.parse(savedReminders));
        const savedHistory = localStorage.getItem('app_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setTimeout(() => setIsAppReady(true), 1200);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const tz = (selectedCountry && selectedCountry.code !== 'GLOBAL') ? getTimezone(selectedCountry.code) : 'UTC';
        setLocalTime(new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: tz }).format(new Date()));
        const nowStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
        const trigger = reminders.find(r => r.timeStr === nowStr);
        if (trigger && !activeAlarm) setActiveAlarm(trigger);
      } catch (e) { setLocalTime('--:--:--'); }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCountry, reminders, activeAlarm]);

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
          setCurrentChannel(data.find(c => c.url) || data[0]);
      }
    } catch (err) { setChannels([]); }
    finally { setLoadingChannels(false); }
  };

  useEffect(() => { if (isAppReady) loadContent(); }, [selectedCountry, mode, isAppReady, discoveryTag]);

  const handleChannelSelect = (channel: Channel) => {
    // 触发切换音效
    playSwitchSound();
    
    setCurrentChannel(channel);
    const newHistory = [channel, ...history.filter(c => c.id !== channel.id)].slice(0, 15);
    setHistory(newHistory);
    localStorage.setItem('app_history', JSON.stringify(newHistory));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleThemeChange = (theme: AppTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('app_theme_id', theme.id);
  };

  const toggleFavorite = (channel: Channel) => {
    setFavorites(prev => {
      const isFav = prev.some(f => f.id === channel.id);
      const next = isFav ? prev.filter(f => f.id !== channel.id) : [...prev, channel];
      localStorage.setItem('global_favorites', JSON.stringify(next));
      return next;
    });
  };

  if (!isAppReady) return (
    <div className="h-screen w-full bg-[#050508] flex flex-col items-center justify-center text-cyan-500">
      <div className="relative mb-8">
        <div className="w-16 h-16 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-pulse" />
        </div>
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.6em] animate-pulse">{t.loading}</div>
    </div>
  );

  const { styles } = currentTheme;

  return (
    <div className={`flex h-screen w-full ${styles.bgMain} ${styles.font} overflow-hidden relative transition-colors duration-1000`}>
      <Sidebar 
        countries={countries} selectedCountry={discoveryTag ? GLOBAL_EXPLORE_COUNTRY : selectedCountry} 
        onSelectCountry={(c) => { setDiscoveryTag(null); setSelectedCountry(c); }}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} mode={mode} onModeChange={setMode}
        themes={THEMES} currentTheme={currentTheme} onThemeChange={handleThemeChange}
        favorites={favorites} onSelectFavorite={handleChannelSelect} history={history}
        onImportM3U={() => {}} settings={settings} onToggleSound={() => setSettings(s => ({...s, enableSound: !s.enableSound}))} 
        onOpenSettings={() => setShowSettings(true)}
        reminders={reminders} onDeleteReminder={(id) => {
            const next = reminders.filter(r => r.id !== id);
            setReminders(next); localStorage.setItem('global_reminders', JSON.stringify(next));
        }} onPlayReminder={handleChannelSelect}
        lang={lang}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
        <header className={`shrink-0 px-8 py-6 flex items-center justify-between border-b ${styles.border} ${styles.bgSidebar} backdrop-blur-3xl z-30 shadow-xl`}>
            <div className="flex items-center gap-6">
                <button onClick={() => setSidebarOpen(true)} className={`md:hidden p-3 rounded-xl ${styles.card} ${styles.textMain}`}><Menu /></button>
                <div className="flex items-center gap-5">
                    <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] animate-float">{discoveryTag ? '🛰️' : selectedCountry?.flag}</span>
                    <div className="flex flex-col">
                        <h1 className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${styles.textMain}`}>
                            {discoveryTag ? discoveryTag : selectedCountry?.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5">
                             <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                             <span className={`text-[9px] font-black tracking-widest uppercase opacity-40 ${styles.textDim}`}>
                                {channels.length} {t.nodesSynchronized}
                             </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-8">
                <button 
                  onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${styles.border} ${styles.button} transition-all hover:scale-105 active:scale-95 shadow-sm`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{lang === 'zh' ? 'EN' : '中文'}</span>
                </button>

                <div className="hidden lg:flex flex-col items-end">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${styles.textDim}`}>{t.nodeTime}</span>
                    <span className={`text-lg font-mono font-black ${styles.textMain}`}>{localTime}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowSchedule(true)} className={`p-3 rounded-xl ${styles.button} hover:scale-110 active:scale-95 transition-all relative`}>
                        <AlarmClock className="w-4 h-4" />
                        {reminders.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-black animate-ping"></span>}
                    </button>
                    <button onClick={() => loadContent(true)} className={`p-3 rounded-xl ${styles.button} hover:rotate-180 transition-all duration-700 ${loadingChannels ? 'animate-spin' : ''}`}>
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>

        <div className={`flex-1 overflow-y-auto scrollbar-thin`}>
            <div className="px-8 py-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col xl:flex-row gap-12">
                    <div className="flex-1 min-w-0 space-y-12">
                        <section className="space-y-8">
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
                              lang={lang}
                            />
                            <FavoritesBar favorites={favorites} currentChannel={currentChannel} onSelectChannel={handleChannelSelect} theme={currentTheme} mode={mode} />
                        </section>

                        <section className="space-y-10">
                            <div className="flex flex-col space-y-8">
                                <h2 className={`text-3xl font-black uppercase italic tracking-tighter ${styles.textMain} flex items-center gap-4`}>
                                    <Sparkles className={`w-6 h-6 ${styles.accentColor} animate-pulse`} /> {t.discoveryTerminal}
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {HOT_TAGS.map(tag => (
                                        <button 
                                            key={tag} onClick={() => { setDiscoveryTag(tag); setChannelFilter(''); }} 
                                            className={`px-6 py-3 ${styles.layoutShape} text-[10px] font-black border transition-all duration-500 group ${discoveryTag === tag ? styles.buttonActive : `${styles.button} opacity-50 hover:opacity-100`}`}
                                        >
                                            <span className="relative z-10"># {tag}</span>
                                        </button>
                                    ))}
                                    {(discoveryTag || channelFilter) && (
                                        <button onClick={() => { setDiscoveryTag(null); setChannelFilter(''); }} className="px-6 py-3 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-lg hover:bg-rose-600 transition-colors uppercase tracking-widest">{t.reset}</button>
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

                    <div className="xl:w-80 shrink-0 space-y-10">
                        <div className="xl:sticky xl:top-8 space-y-10">
                            <div className={`${styles.card} p-8 ${styles.layoutShape} border ${styles.border} group overflow-hidden relative shadow-xl`}>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-40 flex items-center gap-3">
                                    <History className={`w-5 h-5 ${styles.accentColor}`} /> {t.activityLog}
                                </h3>
                                <div className="space-y-5 max-h-80 overflow-y-auto scrollbar-thin">
                                    {history.length > 0 ? history.map(h => (
                                        <div key={h.id} onClick={() => handleChannelSelect(h)} className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 cursor-pointer group/item transition-all active:scale-95`}>
                                            <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover/item:rotate-6 transition-transform">
                                                {h.logo ? <img src={h.logo} className="w-full h-full object-contain p-1.5" /> : <History className="w-4 h-4 opacity-10" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-[11px] font-black uppercase truncate italic tracking-tighter ${styles.textMain}`}>{h.name}</span>
                                                <span className={`text-[8px] font-bold opacity-30 uppercase tracking-widest`}>{h.group || '卫星'}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center text-[10px] font-black opacity-10 uppercase italic tracking-widest">{t.logsEmpty}</div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={() => { if(channels.length > 0) handleChannelSelect(channels[Math.floor(Math.random()*channels.length)]) }} 
                                className={`w-full py-6 ${styles.buttonPrimary} ${styles.layoutShape} font-black uppercase text-[11px] flex items-center justify-center gap-4 shadow-xl hover:translate-y-[-4px] active:translate-y-[2px] transition-all transform animate-breathe`}
                            >
                                <Shuffle className="w-5 h-5" /> {t.randomStation}
                            </button>

                            <AiChatPet theme={currentTheme} currentChannels={channels} onSelectChannel={handleChannelSelect} lang={lang} />
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
      
      <SettingsModal 
        isOpen={showSettings} onClose={() => setShowSettings(false)}
        settings={settings} onToggleSound={() => setSettings(s => ({...s, enableSound: !s.enableSound}))}
        lang={lang} onToggleLang={() => setLang(l => l === 'zh' ? 'en' : 'zh')}
        theme={currentTheme}
        onClearHistory={() => { setHistory([]); localStorage.removeItem('app_history'); }}
        onClearFavorites={() => { setFavorites([]); localStorage.removeItem('global_favorites'); }}
      />
    </div>
  );
};

export default App;
