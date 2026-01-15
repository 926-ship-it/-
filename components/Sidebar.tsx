
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Country, AppTheme, Channel, AppSettings, Reminder } from '../types';
import { Search, Globe, X, Tv, Radio, Palette, Star, Upload, Volume2, VolumeX, Settings, ChevronDown, ChevronUp, CalendarClock, Trash2, Play, Music, Plus, History } from 'lucide-react';

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
  history: Channel[];
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
    onPlayReminder,
    history
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemes, setShowThemes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'schedule' | null>('favorites');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const lowerQ = searchQuery.toLowerCase();
    return countries.filter(c => 
      c.name.toLowerCase().includes(lowerQ) || 
      c.code.toLowerCase().includes(lowerQ)
    );
  }, [countries, searchQuery]);

  const modeFavorites = useMemo(() => favorites.filter(c => (c.type || 'tv') === mode), [favorites, mode]);
  const modeHistory = useMemo(() => history.filter(c => (c.type || 'tv') === mode), [history, mode]);

  const { styles } = currentTheme;

  return (
    <>
        {isOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-xl" onClick={onClose} />}

        <aside className={`
            fixed md:relative z-50 h-full ${styles.bgSidebar} w-80 flex flex-col min-w-0
            transition-transform duration-500 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${styles.shadow}
        `}>
        
        <div className={`p-6 border-b ${styles.border} flex items-center justify-between shrink-0 min-w-0`}>
            <div className={`flex items-center gap-3 ${styles.textMain} min-w-0`}>
                <div className={`p-2 ${styles.buttonPrimary} rounded-xl shadow-lg shrink-0`}>
                    <Globe className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-black tracking-tighter truncate uppercase italic">全球智播</h1>
            </div>
            <button onClick={onClose} className={`md:hidden ${styles.textDim} p-1`}>
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-5 pb-2 space-y-4 shrink-0">
            <div className={`flex p-1 ${styles.layoutShape} ${currentTheme.type === 'web95' ? styles.border : 'bg-black/20'}`}>
                <button 
                    onClick={() => onModeChange('tv')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${styles.layoutShape} text-xs font-black transition-all ${mode === 'tv' ? styles.buttonActive : styles.textDim}`}
                >
                    <Tv className="w-4 h-4" /> 电视模式
                </button>
                <button 
                    onClick={() => onModeChange('radio')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${styles.layoutShape} text-xs font-black transition-all ${mode === 'radio' ? styles.buttonActive : styles.textDim}`}
                >
                    <Radio className="w-4 h-4" /> 广播模式
                </button>
            </div>

            <div className="flex gap-1">
                {(['favorites', 'history', 'schedule'] as const).map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                        className={`flex-1 flex flex-col items-center justify-center py-2 ${styles.layoutShape} transition-all border ${activeTab === tab ? styles.buttonActive : `${styles.button} opacity-40`}`}
                    >
                        {tab === 'favorites' && <Star className="w-3.5 h-3.5 mb-1" />}
                        {tab === 'history' && <History className="w-3.5 h-3.5 mb-1" />}
                        {tab === 'schedule' && <CalendarClock className="w-3.5 h-3.5 mb-1" />}
                        <span className="text-[9px] font-black uppercase tracking-tighter">{tab === 'favorites' ? '收藏' : tab === 'history' ? '记录' : '提醒'}</span>
                    </button>
                ))}
            </div>

            {activeTab && (
                <div className={`p-1.5 ${styles.card} ${styles.layoutShape} space-y-1 max-h-56 overflow-y-auto ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'} animate-in slide-in-from-top-2 duration-300 min-w-0`}>
                    {activeTab === 'favorites' && (
                        modeFavorites.length > 0 ? modeFavorites.map(ch => (
                            <button key={ch.id} onClick={() => { onSelectFavorite(ch); if (window.innerWidth < 768) onClose(); }} className={`w-full flex items-center gap-3 p-2.5 ${styles.layoutShape} hover:bg-white/10 text-left group min-w-0`}>
                                <div className="w-7 h-7 rounded bg-black/40 shrink-0 flex items-center justify-center overflow-hidden">
                                    {ch.logo ? <img src={ch.logo} className="w-full h-full object-contain" /> : <Tv className="w-3.5 h-3.5 opacity-20" />}
                                </div>
                                <span className={`text-[11px] font-black truncate flex-1 uppercase tracking-tight ${styles.textMain}`}>{ch.name}</span>
                            </button>
                        )) : <p className="text-[10px] text-center p-6 opacity-30 font-bold uppercase italic">暂无收藏</p>
                    )}
                </div>
            )}
        </div>

        <div className={`flex-1 overflow-y-auto px-5 space-y-1.5 ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`}>
            <div className={`sticky top-0 z-10 pt-2 pb-3 ${styles.bgSidebar}`}>
                <div className={`relative ${styles.input} ${styles.layoutShape} ${styles.border} flex items-center px-4 py-2.5 shadow-inner min-w-0`}>
                    <Search className={`w-4 h-4 ${styles.textDim} shrink-0`} />
                    <input 
                        type="text" 
                        placeholder="搜索国家/地区..." 
                        className="bg-transparent border-none focus:outline-none text-xs w-full ml-3 font-black uppercase tracking-widest placeholder:opacity-30"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="space-y-1 pb-6 min-w-0">
                {filteredCountries.map(country => (
                    <button
                        key={country.code}
                        onClick={() => { onSelectCountry(country); if (window.innerWidth < 768) onClose(); }}
                        className={`
                            w-full flex items-center gap-4 p-3 ${styles.layoutShape} transition-all min-w-0
                            ${selectedCountry?.code === country.code 
                                ? styles.buttonActive
                                : `${styles.textDim} hover:bg-white/5`
                            }
                        `}
                    >
                        <span className="text-2xl shrink-0 drop-shadow-md">{country.flag}</span>
                        <span className="text-xs font-black truncate uppercase tracking-tight flex-1 text-left">{country.name}</span>
                        {selectedCountry?.code === country.code && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-lg animate-pulse"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        <div className={`p-5 border-t ${styles.border} bg-black/10 space-y-3 shrink-0`}>
            <button onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center justify-center gap-2 py-3 ${styles.layoutShape} ${styles.border} ${styles.button} text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02]`}>
                <Upload className="w-3.5 h-3.5" /> 导入 M3U 播放列表
            </button>
            <input type="file" accept=".m3u,.m3u8" ref={fileInputRef} className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = (ev) => { if (ev.target?.result) onImportM3U(ev.target.result as string); };
                r.readAsText(f);
                e.target.value = '';
            }} />

            <div className="flex gap-2">
                <button onClick={() => { setShowSettings(!showSettings); setShowThemes(false); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold ${styles.button} ${styles.border} ${styles.layoutShape} ${showSettings ? styles.buttonActive : ''}`}>
                    <Settings className="w-4 h-4" /> 设置
                </button>
                <button onClick={() => { setShowThemes(!showThemes); setShowSettings(false); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold ${styles.button} ${styles.border} ${styles.layoutShape} ${showThemes ? styles.buttonActive : ''}`}>
                    <Palette className="w-4 h-4" /> 主题
                </button>
            </div>
            
            {showThemes && (
                 <div className={`p-2 ${styles.card} ${styles.layoutShape} border ${styles.border} space-y-1 max-h-48 overflow-y-auto scrollbar-none`}>
                    {themes.map(t => (
                        <button key={t.id} onClick={() => { onThemeChange(t); setShowThemes(false); }} className={`w-full text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest ${styles.layoutShape} ${currentTheme.id === t.id ? styles.buttonActive : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}>
                            {t.name}
                        </button>
                    ))}
                 </div>
            )}
        </div>
      </aside>
    </>
  );
};
