
import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelGrid } from './components/ChannelGrid';
import { ScheduleList } from './components/ScheduleList';
import { FavoritesBar } from './components/FavoritesBar'; 
import { AiChatPet } from './components/AiChatPet';
import { AlarmModal } from './components/AlarmModal';
import { fetchCountries, fetchChannelsByCountry, fetchRadioStations, parseM3U } from './services/iptvService';
import { Country, Channel, AppTheme, Reminder, AppSettings } from './types';
import { Menu, RefreshCw, CalendarClock, Tv } from 'lucide-react';

const THEMES: AppTheme[] = [
  {
    id: 'glass',
    name: '透明亚克力 (Glass)',
    type: 'glass',
    styles: {
      bgMain: 'bg-gradient-to-br from-indigo-900 via-slate-900 to-black',
      bgSidebar: 'bg-white/5 backdrop-blur-xl border-r border-white/10',
      textMain: 'text-white',
      textDim: 'text-white/60',
      border: 'border-white/10',
      card: 'bg-white/5 hover:bg-white/10 backdrop-blur-md border-white/5 hover:border-white/20',
      cardHover: 'hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/20',
      button: 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm',
      buttonActive: 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]',
      buttonPrimary: 'bg-cyan-500/80 hover:bg-cyan-400/80 text-white shadow-lg shadow-cyan-500/30 backdrop-blur-md',
      input: 'bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:bg-black/40',
      font: 'font-sans',
      layoutShape: 'rounded-2xl',
      shadow: 'shadow-xl',
      accentColor: '#06b6d4'
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
      accentColor: '#000080'
    }
  },
  {
    id: 'cyber',
    name: '极简科技 (Cyber)',
    type: 'cyber',
    styles: {
      bgMain: 'bg-black',
      bgSidebar: 'bg-black border-r border-green-500/30',
      textMain: 'text-green-500',
      textDim: 'text-green-800',
      border: 'border border-green-500/50',
      card: 'bg-black border border-green-900 hover:border-green-500',
      cardHover: 'hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]',
      button: 'bg-black border border-green-700 text-green-500 hover:bg-green-900/30',
      buttonActive: 'bg-green-500 text-black border-green-500',
      buttonPrimary: 'bg-green-600 text-black hover:bg-green-500 font-bold',
      input: 'bg-black border border-green-700 text-green-500 placeholder:text-green-900 focus:border-green-500',
      font: 'font-[JetBrains_Mono,monospace]',
      layoutShape: 'rounded-none',
      shadow: 'shadow-none',
      accentColor: '#22c55e'
    }
  },
  {
    id: 'acid',
    name: '醋酸少女 (Acid)',
    type: 'acid',
    styles: {
      bgMain: 'bg-yellow-300',
      bgSidebar: 'bg-pink-500 border-r-4 border-black',
      textMain: 'text-black',
      textDim: 'text-black/60',
      border: 'border-4 border-black',
      card: 'bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all',
      cardHover: '',
      button: 'bg-purple-400 border-2 border-black text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      buttonActive: 'bg-black text-white border-2 border-black',
      buttonPrimary: 'bg-blue-600 text-white border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-500',
      input: 'bg-white border-4 border-black text-black font-bold placeholder:text-black/30',
      font: 'font-[Inter,sans-serif]',
      layoutShape: 'rounded-xl',
      shadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      accentColor: '#000000'
    }
  },
  {
    id: 'cartoon',
    name: '冒险时光 (Cartoon)',
    type: 'cartoon',
    styles: {
      bgMain: 'bg-[#4facfe]', 
      bgSidebar: 'bg-[#ffd700] border-r-4 border-black', 
      textMain: 'text-black font-bold tracking-tight',
      textDim: 'text-black/70 font-semibold',
      border: 'border-4 border-black',
      card: 'bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform',
      cardHover: 'hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
      button: 'bg-white border-4 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      buttonActive: 'bg-[#ff69b4] text-white border-4 border-black', 
      buttonPrimary: 'bg-[#ff4757] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff6b81]', 
      input: 'bg-white border-4 border-black text-black shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]',
      font: 'font-[Fredoka,sans-serif]',
      layoutShape: 'rounded-[2rem]', 
      shadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      accentColor: '#ff4757'
    }
  }
];

// Special country entry for custom playlists
const CUSTOM_COUNTRY: Country = {
    name: '导入频道 (Custom)',
    code: 'CUSTOM',
    languages: [],
    flag: '📂'
};

const FAVORITES_COUNTRY: Country = {
    name: '我的收藏 (Favorites)',
    code: 'FAVORITES',
    languages: [],
    flag: '⭐'
};

const App: React.FC = () => {
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
  
  const [favorites, setFavorites] = useState<Channel[]>(() => {
      try {
          const saved = localStorage.getItem('global_favorites');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
        const saved = localStorage.getItem('global_reminders');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  const [currentTheme, setCurrentTheme] = useState<AppTheme>(THEMES[0]);

  useEffect(() => {
      localStorage.setItem('global_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
      localStorage.setItem('global_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    // Sync channels with favorites if currently viewing Favorites
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
        
        const defaultCountry = data.find(c => c.code === 'US') || data[0];
        if (defaultCountry) {
            setSelectedCountry(defaultCountry);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  const loadContent = async (refresh = false) => {
    if (!selectedCountry) return;
    
    // Handle Custom Playlist
    if (selectedCountry.code === 'CUSTOM') {
        setChannels(customChannels);
        setLoadingChannels(false);
        return;
    }

    // Handle Favorites Playlist
    if (selectedCountry.code === 'FAVORITES') {
        setChannels(favorites.filter(c => (c.type || 'tv') === mode));
        setLoadingChannels(false);
        return;
    }

    setLoadingChannels(true);
    if (!refresh) {
        setChannels([]);
        setCurrentChannel(null); 
    }
    
    try {
        let data: Channel[] = [];
        if (mode === 'tv') {
            data = await fetchChannelsByCountry(selectedCountry.code, refresh);
        } else {
            data = await fetchRadioStations(selectedCountry.code, refresh);
        }
        setChannels(data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoadingChannels(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [selectedCountry, mode]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setSidebarOpen(false);
  };

  const handleModeChange = (newMode: 'tv' | 'radio') => {
      if (mode === newMode) return;
      setMode(newMode);
      setSidebarOpen(false);
  };

  const handleChannelSelect = (channel: Channel) => {
      setCurrentChannel(channel);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (channel: Channel) => {
      setFavorites(prev => {
          const exists = prev.some(c => c.id === channel.id);
          if (exists) {
              return prev.filter(c => c.id !== channel.id);
          } else {
              const channelWithMeta = { 
                  ...channel, 
                  type: channel.type || mode 
              };
              return [...prev, channelWithMeta];
          }
      });
  };

  const isFavorite = (channel: Channel | null) => {
      if (!channel) return false;
      return favorites.some(c => c.id === channel.id);
  };

  const handleAddReminder = (channel: Channel, time: string) => {
    const newReminder: Reminder = {
        id: Math.random().toString(36).substr(2, 9),
        channelId: channel.id,
        channelName: channel.name,
        timeStr: time,
        created: Date.now()
    };
    setReminders(prev => [...prev, newReminder]);
    alert(`已设置提醒: ${channel.name} @ ${time}`);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handlePlayFromSchedule = (channelId: string) => {
      let channel = channels.find(c => c.id === channelId);
      if (!channel) channel = favorites.find(c => c.id === channelId);
      
      if (channel) {
          setCurrentChannel(channel);
          setActiveReminder(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          alert("无法在当前列表中找到该频道，请先切换到对应的国家或模式。");
      }
  };

  const handleImportM3U = (content: string) => {
      try {
          const parsed = parseM3U(content);
          const tagged = parsed.map(c => ({...c, type: 'tv' as const}));
          setCustomChannels(tagged);
          
          if (!countries.find(c => c.code === 'CUSTOM')) {
              setCountries(prev => [CUSTOM_COUNTRY, ...prev]);
          }
          
          setSelectedCountry(CUSTOM_COUNTRY);
          alert(`成功导入 ${tagged.length} 个频道`);
      } catch (e) {
          alert("解析文件失败，请确认格式正确。");
      }
  };

  return (
    <div className={`flex h-screen ${currentTheme.styles.bgMain} ${currentTheme.styles.font} overflow-hidden transition-colors duration-500`}>
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

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className={`md:hidden ${currentTheme.styles.bgSidebar} border-b ${currentTheme.styles.border} p-4 flex items-center justify-between shrink-0 z-30`}>
            <button onClick={() => setSidebarOpen(true)} className={currentTheme.styles.textMain}>
                <Menu className="w-6 h-6" />
            </button>
            <h1 className={`text-lg font-bold ${currentTheme.styles.textMain}`}>全球实时看和听</h1>
            <div className="flex items-center gap-2">
                <button onClick={() => setShowSchedule(true)} className={currentTheme.styles.textMain}>
                    <CalendarClock className="w-5 h-5" />
                </button>
                <button onClick={() => loadContent(true)} className={currentTheme.styles.textMain}>
                    <RefreshCw className={`w-5 h-5 ${loadingChannels ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </header>

        {/* --- TV ENTHUSIAST LAYOUT --- */}
        <div className={`flex-1 overflow-y-auto ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`}>
            
            {/* 1. CINEMA STAGE AREA (Full Width) */}
            <div className={`w-full relative py-6 px-4 md:px-8 bg-black/40 shadow-2xl`}>
                
                {/* Ambilight/Glow Effect Background */}
                <div 
                    className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000 blur-3xl"
                    style={{ background: `radial-gradient(circle at center, ${currentTheme.styles.accentColor} 0%, transparent 70%)` }}
                ></div>

                <div className="max-w-[1600px] mx-auto relative z-10">
                    
                    {/* Header Info */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${currentTheme.styles.card}`}>
                                <Tv className={`w-6 h-6 ${currentTheme.styles.textMain}`} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${currentTheme.styles.textMain} leading-none`}>
                                    {selectedCountry ? selectedCountry.name : '全球看听'}
                                </h2>
                                <p className={`text-sm ${currentTheme.styles.textDim} mt-1`}>
                                    {channels.length} 信号源在线
                                </p>
                            </div>
                        </div>

                        <div className="hidden md:flex gap-2">
                            <button 
                                onClick={() => setShowSchedule(true)}
                                className={`px-4 py-2 ${currentTheme.styles.button} ${currentTheme.styles.layoutShape} text-sm flex items-center gap-2`}
                            >
                                <CalendarClock className="w-4 h-4" /> 节目表
                            </button>
                            <button 
                                onClick={() => loadContent(true)}
                                className={`px-4 py-2 ${currentTheme.styles.button} ${currentTheme.styles.layoutShape} text-sm flex items-center gap-2`}
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingChannels ? 'animate-spin' : ''}`} /> 刷新
                            </button>
                        </div>
                    </div>

                    {/* Favorites Bar (Horizontal Strip) */}
                    <FavoritesBar 
                        favorites={favorites}
                        currentChannel={currentChannel}
                        onSelectChannel={handleChannelSelect}
                        theme={currentTheme}
                        mode={mode}
                    />

                    {/* THE BIG PLAYER */}
                    <div className="mt-4">
                        <VideoPlayer 
                            channel={currentChannel}
                            country={selectedCountry}
                            autoPlay={true}
                            isRadio={mode === 'radio'}
                            theme={currentTheme}
                            isFavorite={isFavorite(currentChannel)}
                            onToggleFavorite={() => currentChannel && toggleFavorite(currentChannel)}
                            onAddReminder={handleAddReminder}
                            settings={settings}
                        />
                    </div>
                </div>
            </div>

            {/* 2. PROGRAM GUIDE AREA (Channel Grid) */}
            <div className="max-w-[1600px] mx-auto p-4 md:p-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className={`w-1 h-6 ${currentTheme.type === 'cyber' ? 'bg-green-500' : 'bg-current'} rounded-full opacity-50`}></div>
                    <h3 className={`text-lg font-bold ${currentTheme.styles.textMain}`}>频道导视</h3>
                </div>
                
                <ChannelGrid 
                    channels={channels}
                    currentChannel={currentChannel}
                    onSelectChannel={handleChannelSelect}
                    loading={loadingChannels}
                    mode={mode}
                    theme={currentTheme}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                />
            </div>
        </div>
      </main>

      {/* Schedule Modal */}
      <ScheduleList 
        reminders={reminders}
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        onDelete={handleDeleteReminder}
        theme={currentTheme}
        onPlayChannel={handlePlayFromSchedule}
        allChannels={[...channels, ...favorites]}
      />

      {/* Alarm Popup Modal */}
      <AlarmModal 
         reminder={activeReminder}
         onClose={() => setActiveReminder(null)}
         onWatch={handlePlayFromSchedule}
         theme={currentTheme}
      />

      {/* AI Pet Widget */}
      <AiChatPet theme={currentTheme} />
    </div>
  );
};

export default App;
