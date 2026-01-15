
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Country, AppTheme, Channel, AppSettings, Reminder } from '../types';
import { Search, Globe, X, Tv, Radio, Palette, Star, Upload, Volume2, VolumeX, Settings, ChevronDown, ChevronUp, CalendarClock, Trash2, Play, Music, Plus, History, Layers } from 'lucide-react';

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
    countries, selectedCountry, onSelectCountry, isOpen, onClose, mode, onModeChange, themes,
    currentTheme, onThemeChange, favorites, onSelectFavorite, onImportM3U, settings,
    onToggleSound, reminders, onDeleteReminder, onPlayReminder, history
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemes, setShowThemes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'schedule' | null>('favorites');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const lowerQ = searchQuery.toLowerCase();
    return countries.filter(c => c.name.toLowerCase().includes(lowerQ) || c.code.toLowerCase().includes(lowerQ));
  }, [countries, searchQuery]);

  const modeFavorites = useMemo(() => favorites.filter(c => (c.type || 'tv') === mode), [favorites, mode]);
  const { styles } = currentTheme;

  return (
    <>
        {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xl transition-all" onClick={onClose} />}

        <aside className={`
            fixed md:relative z-50 h-full ${styles.bgSidebar} w-85 flex flex-col min-w-0
            transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${styles.shadow} shadow-2xl
        `}>
        
        <div className={`p-8 pb-6 border-b ${styles.border} flex items-center justify-between shrink-0`}>
            <div className={`flex items-center gap-4 ${styles.textMain}`}>
                <div className={`p-3 bg-white text-black rounded-2xl shadow-[0_10px_20px_rgba(255,255,255,0.1)] shrink-0`}>
                    <Globe className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Global</h1>
                    <span className="text-[9px] font-black tracking-[0.4em] uppercase opacity-40 mt-1">Streaming Node</span>
                </div>
            </div>
            <button onClick={onClose} className={`md:hidden ${styles.textDim} p-2 hover:bg-white/5 rounded-full transition-colors`}>
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-6 space-y-6 shrink-0">
            {/* Mode Switcher Pill */}
            <div className={`flex p-1.5 ${styles.layoutShape} bg-black/40 border ${styles.border} shadow-inner`}>
                <button 
                    onClick={() => onModeChange('tv')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 ${styles.layoutShape} text-[10px] font-black transition-all duration-500 uppercase tracking-widest ${mode === 'tv' ? `${styles.buttonActive} shadow-lg` : `${styles.textDim} hover:bg-white/5`}`}
                >
                    <Tv className="w-4 h-4" /> Vision
                </button>
                <button 
                    onClick={() => onModeChange('radio')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 ${styles.layoutShape} text-[10px] font-black transition-all duration-500 uppercase tracking-widest ${mode === 'radio' ? `${styles.buttonActive} shadow-lg` : `${styles.textDim} hover:bg-white/5`}`}
                >
                    <Radio className="w-4 h-4" /> Waves
                </button>
            </div>

            <div className="flex gap-2">
                {(['favorites', 'history', 'schedule'] as const).map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 ${styles.layoutShape} transition-all border ${activeTab === tab ? styles.buttonActive : `${styles.card} border-transparent opacity-60 hover:opacity-100`}`}
                    >
                        {tab === 'favorites' && <Star className={`w-4 h-4 mb-1.5 ${activeTab === tab ? 'fill-current' : ''}`} />}
                        {tab === 'history' && <History className="w-4 h-4 mb-1.5" />}
                        {tab === 'schedule' && <CalendarClock className="w-4 h-4 mb-1.5" />}
                        <span className="text-[8px] font-black uppercase tracking-widest">{tab === 'favorites' ? 'Saved' : tab === 'history' ? 'Logs' : 'Alert'}</span>
                    </button>
                ))}
            </div>

            {activeTab && (
                <div className={`p-2 ${styles.card} ${styles.layoutShape} border ${styles.border} space-y-1.5 max-h-64 overflow-y-auto ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'} animate-in slide-in-from-top-4 duration-500 shadow-xl`}>
                    {activeTab === 'favorites' && (
                        modeFavorites.length > 0 ? modeFavorites.map(ch => (
                            <button key={ch.id} onClick={() => { onSelectFavorite(ch); if (window.innerWidth < 768) onClose(); }} className={`w-full flex items-center gap-4 p-3 ${styles.layoutShape} hover:bg-white/5 text-left group transition-all`}>
                                <div className="w-9 h-9 rounded-xl bg-black/40 shrink-0 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                    {ch.logo ? <img src={ch.logo} className="w-full h-full object-contain p-1.5" /> : <Star className="w-4 h-4 opacity-20" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-[11px] font-black truncate uppercase tracking-tight ${styles.textMain}`}>{ch.name}</span>
                                    <span className={`text-[8px] font-bold opacity-30 uppercase tracking-tighter`}>{ch.group || 'General'}</span>
                                </div>
                            </button>
                        )) : <div className="py-10 text-center text-[9px] font-black opacity-20 uppercase italic">Collection Empty</div>
                    )}
                </div>
            )}
        </div>

        <div className={`flex-1 overflow-y-auto px-6 space-y-2 ${currentTheme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`}>
            <div className={`sticky top-0 z-20 pt-2 pb-4 ${styles.bgSidebar}`}>
                <div className={`relative ${styles.input} ${styles.layoutShape} border ${styles.border} flex items-center px-5 py-3.5 transition-all focus-within:ring-2 focus-within:ring-white/10 group shadow-inner`}>
                    <Search className={`w-4 h-4 ${styles.textDim} group-focus-within:text-white transition-colors`} />
                    <input 
                        type="text" 
                        placeholder="Search regions..." 
                        className="bg-transparent border-none focus:outline-none text-[11px] w-full ml-4 font-black uppercase tracking-widest placeholder:opacity-30"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="space-y-1.5 pb-8">
                {filteredCountries.map(country => (
                    <button
                        key={country.code}
                        onClick={() => { onSelectCountry(country); if (window.innerWidth < 768) onClose(); }}
                        className={`
                            w-full flex items-center gap-5 p-4 ${styles.layoutShape} transition-all group relative active:scale-95
                            ${selectedCountry?.code === country.code 
                                ? `${styles.buttonActive} shadow-xl scale-[1.02] border-none` 
                                : `${styles.textDim} hover:bg-white/5`
                            }
                        `}
                    >
                        <span className="text-3xl shrink-0 group-hover:rotate-6 transition-transform filter drop-shadow-md">{country.flag}</span>
                        <div className="flex flex-col min-w-0">
                            <span className={`text-xs font-black truncate uppercase tracking-tight ${selectedCountry?.code === country.code ? 'text-black' : styles.textMain}`}>{country.name}</span>
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-30 ${selectedCountry?.code === country.code ? 'text-black' : ''}`}>{country.code} Network</span>
                        </div>
                        {selectedCountry?.code === country.code && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black shadow-lg animate-pulse"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        <div className={`p-6 border-t ${styles.border} bg-black/10 space-y-4`}>
            <button onClick={() => fileInputRef.current?.click()} className={`w-full flex items-center justify-center gap-3 py-4 ${styles.layoutShape} ${styles.border} ${styles.button} text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95`}>
                <Upload className="w-4 h-4" /> Global Link Protocol
            </button>
            <input type="file" accept=".m3u,.m3u8" ref={fileInputRef} className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                    const r = new FileReader();
                    r.onload = (ev) => { if (ev.target?.result) onImportM3U(ev.target.result as string); };
                    r.readAsText(f);
                }
            }} />

            <div className="flex gap-3">
                <button onClick={() => { setShowSettings(!showSettings); setShowThemes(false); }} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase ${styles.button} ${styles.border} ${styles.layoutShape} transition-all ${showSettings ? styles.buttonActive : 'opacity-60'}`}>
                    <Settings className="w-4 h-4" /> Setup
                </button>
                <button onClick={() => { setShowThemes(!showThemes); setShowSettings(false); }} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase ${styles.button} ${styles.border} ${styles.layoutShape} transition-all ${showThemes ? styles.buttonActive : 'opacity-60'}`}>
                    <Palette className="w-4 h-4" /> Visuals
                </button>
            </div>
            
            {showThemes && (
                 <div className={`p-2.5 ${styles.card} ${styles.layoutShape} border ${styles.border} space-y-1 max-h-56 overflow-y-auto scrollbar-none animate-in slide-in-from-bottom-4 duration-500 shadow-2xl`}>
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-20 mb-2 px-3">Available UI Protocols</div>
                    {themes.map(t => (
                        <button key={t.id} onClick={() => { onThemeChange(t); setShowThemes(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest ${styles.layoutShape} transition-all ${currentTheme.id === t.id ? styles.buttonActive : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}>
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
