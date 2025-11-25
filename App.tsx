import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelGrid } from './components/ChannelGrid';
import { ScheduleList } from './components/ScheduleList';
import { FavoritesBar } from './components/FavoritesBar'; 
import { AiChatPet } from './components/AiChatPet';
import { AlarmModal } from './components/AlarmModal';
import { fetchCountries, fetchChannelsByCountry, fetchRadioStations, parseM3U } from './services/iptvService';
import { Country, Channel, AppTheme, Reminder, AppSettings } from './types';
import { Menu, RefreshCw, CalendarClock, Tv, Sparkles } from 'lucide-react';

const THEMES: AppTheme[] = [
  {
    id: 'glass',
    name: '透明亚克力 (Glass)',
    type: 'glass',
    styles: {
      bgMain: 'bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617]', // Rich dark blue/purple
      bgSidebar: 'bg-white/5 backdrop-blur-2xl border-r border-white/10',
      textMain: 'text-white drop-shadow-sm',
      textDim: 'text-slate-400',
      border: 'border-white/10',
      card: 'bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all duration-300',
      cardHover: 'hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/20',
      button: 'bg-white/5 hover:bg-white/15 text-white backdrop-blur-sm border border-white/5',
      buttonActive: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border-white/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
      buttonPrimary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50',
      input: 'bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 focus:border-cyan-500/50',
      font: 'font-sans',
      layoutShape: 'rounded-2xl',
      shadow: 'shadow-2xl',
      accentColor: '#06b6d4',
      bgPattern: ''
    }
  },
  {
    id: 'web95',
    name: 'Web 1.0 (怀旧)',
    type: 'web95',
    styles: {
      bgMain: 'bg-[#008080]', 
      bgSidebar: 'bg-[#c0c0c0] border-r-2 border-r-black border-t-white',
      textMain: 'text-black',
      textDim: 'text-gray-600',
      border: 'border-2 border-t-white border-l-white border-b-black border-r-black', 
      card: 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white',
      cardHover: '',
      button: 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-black',
      buttonActive: 'bg-[#c0c0c0] border-2 border-t-black border-l-black border-b-white border-r-white text-black font-bold',
      buttonPrimary: 'bg-[#000080] text-white border-2 border-t-white border-l-white border-b-black border-r-black',
      input: 'bg-white border-2 border-t-black border-l-black border-b-white border-r-white text-black font-mono',
      font: 'font-[Arial,sans-serif]',
      layoutShape: 'rounded-none',
      shadow: '',
      accentColor: '#000080',
      bgPattern: ''
    }
  },
  {
    id: 'cyber',
    name: '极简科技 (Cyber)',
    type: 'cyber',
    styles: {
      bgMain: 'bg-[#050505]',
      bgSidebar: 'bg-black/90 border-r border-green-500/30 backdrop-blur-sm',
      textMain: 'text-green-400 text-shadow-sm',
      textDim: 'text-green-900',
      border: 'border border-green-500/40',
      card: 'bg-black/60 border border-green-900/50 hover:border-green-400 hover:bg-green-900/10 backdrop-blur-sm',
      cardHover: 'hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]',
      button: 'bg-black border border-green-800 text-green-600 hover:bg-green-900/20 hover:border-green-500',
      buttonActive: 'bg-green-500/10 text-green-400 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]',
      buttonPrimary: 'bg-green-600 text-black hover:bg-green-500 font-bold tracking-wider',
      input: 'bg-black border border-green-800 text-green-500 placeholder:text-green-900 focus:border-green-400',
      font: 'font-[JetBrains_Mono,monospace]',
      layoutShape: 'rounded-none',
      shadow: 'shadow-none',
      accentColor: '#22c55e',
      bgPattern: 'bg-grid-pattern animate-grid-move' // Moving Grid
    }
  },
  {
    id: 'acid',
    name: '醋酸少女 (Acid)',
    type: 'acid',
    styles: {
      bgMain: 'bg-[#fef08a]', // Lemon Yellow
      bgSidebar: 'bg-[#f472b6] border-r-4 border-black',
      textMain: 'text-black font-black',
      textDim: 'text-black/60 font-bold',
      border: 'border-4 border-black',
      card: 'bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all',
      cardHover: '',
      button: 'bg-[#c084fc] border-2 border-black text-white font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
      buttonActive: 'bg-black text-white border-2 border-black',
      buttonPrimary: 'bg-[#2563eb] text-white border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#3b82f6]',
      input: 'bg-white border-4 border-black text-black font-bold placeholder:text-black/30',
      font: 'font-[Inter,sans-serif]',
      layoutShape: 'rounded-xl',
      shadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      accentColor: '#000000',
      bgPattern: 'bg-dot-pattern' // Dots
    }
  },
  {
    id: 'cartoon',
    name: '冒险时光 (Cartoon)',
    type: 'cartoon',
    styles: {
      bgMain: 'bg-[#bae6fd]', // Sky Blue
      bgSidebar: 'bg-[#fde047] border-r-4 border-black', // Jake Yellow
      textMain: 'text-slate-900 font-extrabold tracking-tight',
      textDim: 'text-slate-600 font-bold',
      border: 'border-4 border-black',
      card: 'bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform',
      cardHover: 'hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:rotate-1',
      button: 'bg-white border-4 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none rounded-full',
      buttonActive: 'bg-[#ff69b4] text-white border-4 border-black', 
      buttonPrimary: 'bg-[#ff4757] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff6b81]', 
      input: 'bg-white border-4 border-black text-black shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.1)]',
      font: 'font-[Fredoka,sans-serif]',
      layoutShape: 'rounded-[2rem]', 
      shadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      accentColor: '#ff4757',
      bgPattern: 'bg-dot-pattern'
    }
  }
];

const CUSTOM_COUNTRY: Country = { name: '导入频道 (Custom)', code: 'CUSTOM', languages: [], flag: '📂' };
const FAVORITES_COUNTRY: Country = { name: '我的收藏 (Favorites)', code: 'FAVORITES', languages: [], flag: '⭐' };

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [customChannels, setCustomChannels] = useState<Channel[]>([]);
  
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<'tv' | 'radio'>('tv');
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ enableSound: true });
  
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES[0]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playUiSound = useCallback(() => {
      if (!settings.enableSound) return;
      try {
          if (!audioCtxRef.current) {
              audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') ctx.resume();

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
      } catch (e) { /* ignore */ }
  }, [settings.enableSound]);

  useEffect(() => {
      const handleGlobalClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const interactive = target.closest('button') || target.closest('a') || target.closest('input') || target.closest('[role="button"]');
          if (interactive) playUiSound();
      };
      window.addEventListener('click', handleGlobalClick, true); 
      return () => window.removeEventListener('click', handleGlobalClick, true);
  }, [playUiSound]);

  useEffect(() => {
      try {
          const savedFavs = localStorage.getItem('global_favorites');
          if (savedFavs) setFavorites(JSON.parse(savedFavs));
          const savedRems = localStorage.getItem('global_reminders');
          if (savedRems) setReminders(JSON.parse(savedRems));
      } catch (e) { console.warn(e); }
      setIsAppReady(true);
  }, []);

  useEffect(() => {
      if (isAppReady) {
        localStorage.setItem('global_favorites', JSON.stringify(favorites));
        localStorage.setItem('global_reminders', JSON.stringify(reminders));
      }
  }, [favorites, reminders, isAppReady]);

  useEffect(() => {
    if (selectedCountry?.code === 'FAVORITES') {
        setChannels(favorites.filter(c => (c.type || 'tv') === mode));
    }
  }, [favorites, selectedCountry, mode]);

  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        reminders.forEach(reminder => {
            if (reminder.timeStr === currentTimeStr) {
                 const lastAlerted = sessionStorage.getItem(`alerted_${reminder.id}_${currentTimeStr}`);
                 if (!lastAlerted) {
                     setActiveReminder(reminder);
                     sessionStorage.setItem(`alerted_${reminder.id}_${currentTimeStr}`, 'true');
                 }
            }
        });
    }, 10000); 
    return () => clearInterval(interval);
  }, [reminders]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await fetchCountries();
        setCountries([FAVORITES_COUNTRY, ...data]);
        let defaultCountry = data.find(c => c.code === 'CN') || data.find(c => c.code === 'US') || data[0];
        if (defaultCountry) setSelectedCountry(defaultCountry);
        else setSelectedCountry(FAVORITES_COUNTRY);
      } catch (err) {
        setCountries([FAVORITES_COUNTRY]);
        setSelectedCountry(FAVORITES_COUNTRY);
      } finally {
        setLoadingCountries(false);
      }
    };
    if (isAppReady) loadCountries();
  }, [isAppReady]);

  const loadContent = async (refresh = false) => {
    if (!selectedCountry) return;
    if (selectedCountry.code === 'CUSTOM') {
        setChannels(customChannels);
        setLoadingChannels(false);
        return;
    }
    if (selectedCountry.code === 'FAVORITES') {
        setChannels(favorites.filter(c => (c.type || 'tv') === mode));
        setLoadingChannels(false);
        return;
    }
    setLoadingChannels(true);
    if (!refresh) setChannels([]);
    try {
        let data: Channel[] = [];
        if (mode === 'tv') data = await fetchChannelsByCountry(selectedCountry.code, refresh);
        else data = await fetchRadioStations(selectedCountry.code, refresh);
        setChannels(data);
    } catch (err) { setChannels([]); } 
    finally { setLoadingChannels(false); }
  };

  useEffect(() => { loadContent(); }, [selectedCountry, mode]);

  const handleCountrySelect = (country: Country) => { setSelectedCountry(country); setSidebarOpen(false); };
  const handleModeChange = (newMode: 'tv' | 'radio') => { if (mode !== newMode) { setMode(newMode); setSidebarOpen(false); } };
  const handleChannelSelect = (channel: Channel) => { setCurrentChannel(channel); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const toggleFavorite = (channel: Channel) => {
      setFavorites(prev => {
          const exists = prev.some(c => c.id === channel.id);
          if (exists) return prev.filter(c => c.id !== channel.id);
          return [...prev, { ...channel, type: channel.type || mode }];
      });
  };
  const isFavorite = (channel: Channel | null) => !!channel && favorites.some(c => c.id === channel.id);
  const handleAddReminder = (channel: Channel, time: string) => {
    setReminders(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), channelId: channel.id, channelName: channel.name, timeStr: time, created: Date.now() }]);
    alert(`已设置提醒: ${channel.name} @ ${time}`);
  };
  const handleDeleteReminder = (id: string) => setReminders(prev => prev.filter(r => r.id !== id));
  const handlePlayFromSchedule = (channelId: string) => {
      let channel = channels.find(c => c.id === channelId) || favorites.find(c => c.id === channelId);
      if (channel) { setCurrentChannel(channel); setActiveReminder(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else alert("无法在当前列表中找到该频道，请先切换到对应的国家或模式。");
  };
  const handleImportM3U = (content: string) => {
      try {
          const parsed = parseM3U(content);
          setCustomChannels(parsed.map(c => ({...c, type: 'tv' as const})));
          if (!countries.find(c => c.code === 'CUSTOM')) setCountries(prev => [CUSTOM_COUNTRY, ...prev]);
          setSelectedCountry(CUSTOM_COUNTRY);
          alert(`成功导入 ${parsed.length} 个频道`);
      } catch (e) { alert("解析文件失败"); }
  };

  if (!isAppReady || !currentTheme) return <div className="flex h-screen w-full items-center justify-center bg-black text-white">Loading...</div>;

  return (
    <div className={`flex h-screen ${currentTheme.styles.bgMain} ${currentTheme.styles.bgPattern} ${currentTheme.styles.font} overflow-hidden transition-colors duration-500 relative`}>
      {/* GLOBAL NOISE TEXTURE */}
      <div className="bg-noise"></div>

      <Sidebar 
        countries={countries}
        selectedCountry={selectedCountry}
        onSelectCountry={handleCountrySelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mode={mode}
        onModeChange={handleModeChange}
        themes={THEMES}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        favorites={favorites}
        onSelectFavorite={handleChannelSelect}
        onImportM3U={handleImportM3U}
        settings={settings}
        onToggleSound={() => setSettings(prev => ({ ...prev, enableSound: !prev.enableSound }))}
        reminders={reminders}
        onDeleteReminder={handleDeleteReminder}
        onPlayReminder={handlePlayFromSchedule}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header className={`md:hidden ${currentTheme.styles.bgSidebar} border-b ${currentTheme.styles.border} p-4 flex items-center justify-between shrink-0 z-30`}>
            <button onClick={() => setSidebarOpen(true)} className={currentTheme.styles.textMain}><Menu className="w-6 h-6" /></button>
            <h1 className={`text-lg font-bold ${currentTheme.styles.textMain}`}>全球实时看和听</h1>
            <div className="flex items-center gap-2">
                <button onClick={() => setShowSchedule(true)} className={currentTheme.styles.textMain}><CalendarClock className="w-5 h-5" /></button>
                <button onClick={() => loadContent(true)} className={currentTheme.styles.textMain}><RefreshCw className={`w-5 h-5 ${loadingChannels ? 'animate-spin' : ''}`} /></button>
            </div>
        </header>

        <div className={`flex-1 overflow-y-auto ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`}>
            <div className={`w-full relative py-6 px-4 md:px-8 shadow-2xl ${currentTheme.type === 'glass' ? 'bg-black/30' : 'bg-black/10'} border-b ${currentTheme.styles.border}`}>
                <div 
                    className="absolute inset-0 opacity-30 pointer-events-none transition-colors duration-1000 blur-3xl animate-pulse-glow"
                    style={{ background: `radial-gradient(circle at center, ${currentTheme.styles.accentColor} 0%, transparent 70%)` }}
                ></div>

                <div className="max-w-[1600px] mx-auto relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${currentTheme.styles.card} backdrop-blur-md shadow-lg border-0`}>
                                <Tv className={`w-6 h-6 ${currentTheme.styles.textMain}`} />
                            </div>
                            <div>
                                <h2 className={`text-3xl font-black tracking-tight bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent ${currentTheme.type === 'web95' ? 'text-black bg-none' : ''}`}>
                                    {selectedCountry ? selectedCountry.name : '全球看听'}
                                </h2>
                                <p className={`text-xs font-bold uppercase tracking-widest ${currentTheme.styles.textDim} mt-1 flex items-center gap-1`}>
                                    <Sparkles className="w-3 h-3" /> {channels.length} 信号源在线
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:flex gap-2">
                            <button onClick={() => setShowSchedule(true)} className={`px-4 py-2 ${currentTheme.styles.button} ${currentTheme.styles.layoutShape} text-sm flex items-center gap-2 font-medium`}><CalendarClock className="w-4 h-4" /> 节目表</button>
                            <button onClick={() => loadContent(true)} className={`px-4 py-2 ${currentTheme.styles.button} ${currentTheme.styles.layoutShape} text-sm flex items-center gap-2 font-medium`}><RefreshCw className={`w-4 h-4 ${loadingChannels ? 'animate-spin' : ''}`} /> 刷新</button>
                        </div>
                    </div>

                    <FavoritesBar favorites={favorites} currentChannel={currentChannel} onSelectChannel={handleChannelSelect} theme={currentTheme} mode={mode} />

                    <div className="mt-4">
                        <VideoPlayer channel={currentChannel} country={selectedCountry} autoPlay={true} isRadio={mode === 'radio'} theme={currentTheme} isFavorite={isFavorite(currentChannel)} onToggleFavorite={() => currentChannel && toggleFavorite(currentChannel)} onAddReminder={handleAddReminder} settings={settings} />
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 md:p-8">
                <div className="flex items-center gap-3 mb-6 px-1">
                    <div className={`w-1.5 h-8 ${currentTheme.type === 'cyber' ? 'bg-green-500' : currentTheme.styles.buttonPrimary} rounded-full shadow-lg shadow-current opacity-80`}></div>
                    <h3 className={`text-xl font-bold ${currentTheme.styles.textMain}`}>频道导视</h3>
                </div>
                
                <ChannelGrid channels={channels} currentChannel={currentChannel} onSelectChannel={handleChannelSelect} loading={loadingChannels} mode={mode} theme={currentTheme} favorites={favorites} onToggleFavorite={toggleFavorite} />
            </div>
        </div>
      </main>

      <ScheduleList reminders={reminders} isOpen={showSchedule} onClose={() => setShowSchedule(false)} onDelete={handleDeleteReminder} theme={currentTheme} onPlayChannel={handlePlayFromSchedule} allChannels={[...channels, ...favorites]} />
      <AlarmModal reminder={activeReminder} onClose={() => setActiveReminder(null)} onWatch={handlePlayFromSchedule} theme={currentTheme} />
      <AiChatPet theme={currentTheme} />
    </div>
  );
};

export default App;