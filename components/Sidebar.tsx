import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Country, AppTheme, Channel, AppSettings, Reminder } from '../types';
import { Search, Globe, X, Tv, Radio, Palette, Star, Upload, Volume2, VolumeX, Settings, ChevronDown, ChevronUp, CalendarClock, Trash2, Play, Music, Plus } from 'lucide-react';

interface SidebarProps {
  countries: Country[];
  selectedCountry: Country | null;
  onSelectCountry: (country: Country) => void;
  isOpen: boolean;
  onClose: () => void;
  mode: 'tv' | 'radio';
  onModeChange: (mode: 'tv' | 'radio') => void;
  themes: AppTheme[];
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  favorites: Channel[];
  onSelectFavorite: (channel: Channel) => void;
  onImportM3U: (content: string) => void;
  settings: AppSettings;
  onToggleSound: () => void;
  reminders: Reminder[];
  onDeleteReminder: (id: string) => void;
  onPlayReminder: (channelId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    countries, 
    selectedCountry, 
    onSelectCountry,
    isOpen,
    onClose,
    mode,
    onModeChange,
    themes,
    currentTheme,
    onThemeChange,
    favorites,
    onSelectFavorite,
    onImportM3U,
    settings,
    onToggleSound,
    reminders,
    onDeleteReminder,
    onPlayReminder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemes, setShowThemes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'favorites' | 'schedule' | null>('favorites');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const lowerQ = searchQuery.toLowerCase();
    return countries.filter(c => 
      c.name.toLowerCase().includes(lowerQ) || 
      c.code.toLowerCase().includes(lowerQ)
    );
  }, [countries, searchQuery]);

  const modeFavorites = useMemo(() => {
      return favorites.filter(c => (c.type || 'tv') === mode);
  }, [favorites, mode]);

  const sortedReminders = useMemo(() => {
      return [...reminders].sort((a, b) => a.timeStr.localeCompare(b.timeStr));
  }, [reminders]);

  useEffect(() => {
      if (modeFavorites.length > 0 && activeTab === null) {
          setActiveTab('favorites');
      }
  }, [modeFavorites.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              onImportM3U(content);
              if (window.innerWidth < 768) onClose();
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const { styles } = currentTheme;

  return (
    <>
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                onClick={onClose}
            />
        )}

        <aside className={`
            fixed md:relative z-50 h-full ${styles.bgSidebar} w-80 flex flex-col
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${styles.shadow}
        `}>
        
        {/* HEADER */}
        <div className={`p-4 border-b ${styles.border} flex items-center justify-between shrink-0`}>
            <div className={`flex items-center gap-2 ${styles.textMain}`}>
                <Globe className="w-6 h-6" />
                <h1 className="text-xl font-bold tracking-tight">全球看听</h1>
            </div>
            <button onClick={onClose} className={`md:hidden ${styles.textDim} hover:${styles.textMain}`}>
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* TOP NAVIGATION (Mode & Favorites) */}
        <div className="p-4 pb-2 space-y-4 shrink-0">
            {/* Mode Switcher */}
            <div className={`flex p-1 ${styles.layoutShape} ${currentTheme.type === 'web95' ? styles.border : 'bg-black/10'}`}>
                <button 
                    onClick={() => onModeChange('tv')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 ${styles.layoutShape} text-sm font-medium transition-all ${mode === 'tv' ? styles.buttonActive : styles.textDim}`}
                >
                    <Tv className="w-4 h-4" /> TV
                </button>
                <button 
                    onClick={() => onModeChange('radio')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 ${styles.layoutShape} text-sm font-medium transition-all ${mode === 'radio' ? styles.buttonActive : styles.textDim}`}
                >
                    <Radio className="w-4 h-4" /> Radio
                </button>
            </div>

            {/* Favorites / Schedule Tabs */}
            <div className={`space-y-2`}>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab(activeTab === 'favorites' ? null : 'favorites')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold ${styles.layoutShape} ${styles.border} transition-all ${activeTab === 'favorites' ? styles.buttonActive : styles.button}`}
                    >
                        <Star className={`w-3 h-3 ${activeTab === 'favorites' ? 'fill-current' : ''}`} /> 收藏 ({modeFavorites.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab(activeTab === 'schedule' ? null : 'schedule')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold ${styles.layoutShape} ${styles.border} transition-all ${activeTab === 'schedule' ? styles.buttonActive : styles.button}`}
                    >
                        <CalendarClock className="w-3 h-3" /> 节目单 ({sortedReminders.length})
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'favorites' && (
                    <div className={`p-2 ${styles.card} ${styles.layoutShape} z-10 space-y-1 max-h-48 overflow-y-auto ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'} animate-in slide-in-from-top-2`}>
                        {modeFavorites.length > 0 ? (
                            modeFavorites.map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => {
                                        onSelectFavorite(channel);
                                        if (window.innerWidth < 768) onClose();
                                    }}
                                    className={`w-full flex items-center gap-2 p-1.5 ${styles.layoutShape} transition-all hover:bg-white/10 text-left group`}
                                >
                                    <div className="w-6 h-6 rounded flex items-center justify-center bg-black/10 shrink-0 overflow-hidden border border-white/10">
                                        {channel.logo ? (
                                            <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain" />
                                        ) : (
                                            mode === 'tv' ? <Tv className="w-3 h-3 opacity-50" /> : <Music className="w-3 h-3 opacity-50" />
                                        )}
                                    </div>
                                    <span className={`text-xs font-medium truncate flex-1 ${styles.textMain}`}>{channel.name}</span>
                                    <Play className={`w-3 h-3 opacity-0 group-hover:opacity-100 ${styles.textMain}`} />
                                </button>
                            ))
                        ) : (
                            <div className={`p-3 text-center text-xs ${styles.textDim} opacity-70`}>
                                暂无收藏。点击列表中的星星添加。
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className={`p-2 ${styles.card} ${styles.layoutShape} z-10 space-y-1 max-h-48 overflow-y-auto ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'} animate-in slide-in-from-top-2`}>
                        {sortedReminders.length > 0 ? (
                            sortedReminders.map(reminder => (
                                <div key={reminder.id} className={`flex items-center justify-between p-1.5 ${styles.layoutShape} bg-white/5 group`}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className={`text-xs font-mono font-bold ${styles.textMain} bg-black/20 px-1 rounded`}>
                                            {reminder.timeStr}
                                        </span>
                                        <span className={`text-xs truncate ${styles.textDim}`}>{reminder.channelName}</span>
                                    </div>
                                    <button onClick={() => onDeleteReminder(reminder.id)} className={`p-1 hover:text-red-400 ${styles.textDim}`} title="删除">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className={`p-3 text-center text-xs ${styles.textDim} opacity-70`}>
                                暂无提醒。
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* MIDDLE: Country List (Expands) */}
        <div className={`flex-1 overflow-y-auto px-4 space-y-2 ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`}>
            <div className={`sticky top-0 z-10 pt-2 pb-2 ${styles.bgSidebar}`}>
                <div className={`relative ${styles.input} ${styles.layoutShape} ${styles.border} flex items-center px-3 py-2 shadow-sm`}>
                    <Search className={`w-4 h-4 ${styles.textDim}`} />
                    <input 
                        type="text" 
                        placeholder="搜索国家/地区..." 
                        className="bg-transparent border-none focus:outline-none text-sm w-full ml-2 placeholder-opacity-50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="space-y-1 pb-2">
                {filteredCountries.map(country => (
                    <button
                        key={country.code}
                        onClick={() => {
                            onSelectCountry(country);
                            if (window.innerWidth < 768) onClose();
                        }}
                        className={`
                            w-full flex items-center gap-3 p-2 ${styles.layoutShape} transition-all
                            ${selectedCountry?.code === country.code 
                                ? styles.buttonActive
                                : `${styles.textDim} hover:${styles.textMain} hover:bg-white/5`
                            }
                        `}
                    >
                        <span className="text-xl shrink-0">{country.flag}</span>
                        <span className="text-sm font-medium truncate">{country.name}</span>
                        {selectedCountry?.code === country.code && (
                            <div className={`ml-auto w-1.5 h-1.5 rounded-full ${currentTheme.type === 'cyber' ? 'bg-green-500' : 'bg-white'}`}></div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* BOTTOM: System / Settings / Import (Fixed Footer) */}
        <div className={`p-4 pt-2 border-t ${styles.border} bg-black/5 space-y-2 mt-auto`}>
            
            {/* Import */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 py-2 ${styles.layoutShape} ${styles.border} ${styles.button} text-xs transition-colors opacity-80 hover:opacity-100`}
            >
                <Upload className="w-3 h-3" /> 导入 M3U
            </button>
            <input type="file" accept=".m3u,.m3u8" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

            <div className="flex gap-2">
                {/* Settings Toggle */}
                <div className="relative flex-1">
                    <button 
                        onClick={() => { setShowSettings(!showSettings); setShowThemes(false); }}
                        className={`w-full flex items-center justify-center gap-2 px-2 py-2 text-xs ${styles.button} ${styles.border} ${styles.layoutShape} ${showSettings ? styles.buttonActive : ''}`}
                    >
                        <Settings className="w-3 h-3" /> 设置
                    </button>
                    {showSettings && (
                        <div className={`absolute bottom-full left-0 w-full mb-2 p-2 ${styles.card} ${styles.layoutShape} z-50 shadow-xl`}>
                            <button
                                onClick={onToggleSound}
                                className={`flex items-center justify-between w-full px-2 py-1.5 text-xs ${styles.layoutShape} ${styles.button} hover:bg-white/5`}
                            >
                                <span className="flex items-center gap-2">
                                    {settings.enableSound ? <Volume2 className="w-3 h-3 text-green-500" /> : <VolumeX className="w-3 h-3 text-red-500" />}
                                    提示音
                                </span>
                                <div className={`w-6 h-3 rounded-full p-0.5 transition-colors ${settings.enableSound ? 'bg-green-500' : 'bg-gray-600'}`}>
                                    <div className={`w-2 h-2 bg-white rounded-full shadow-sm transition-transform ${settings.enableSound ? 'translate-x-3' : 'translate-x-0'}`}></div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <div className="relative flex-1">
                    <button 
                        onClick={() => { setShowThemes(!showThemes); setShowSettings(false); }}
                        className={`w-full flex items-center justify-center gap-2 px-2 py-2 text-xs ${styles.button} ${styles.border} ${styles.layoutShape} ${showThemes ? styles.buttonActive : ''}`}
                    >
                        <Palette className="w-3 h-3" /> 风格
                    </button>
                    {showThemes && (
                        <div className={`absolute bottom-full right-0 w-48 mb-2 p-2 ${styles.card} ${styles.layoutShape} grid grid-cols-1 gap-1 z-50 shadow-xl`}>
                            {themes.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { onThemeChange(t); setShowThemes(false); }}
                                    className={`
                                        w-full text-left px-3 py-2 text-xs ${styles.layoutShape} transition-all
                                        ${currentTheme.id === t.id ? styles.buttonActive : `${styles.textDim} hover:${styles.textMain} hover:bg-white/5`}
                                    `}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </aside>
    </>
  );
};