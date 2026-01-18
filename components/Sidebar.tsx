
import React, { useState, useMemo, useRef } from 'react';
import { Country, AppTheme, Channel, AppSettings, Reminder, Language } from '../types';
import { Search, Globe, X, Tv, Radio, Palette, Star, Link, Settings, Check, Volume2, VolumeX } from 'lucide-react';

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
  onImportM3U: () => void;
  settings: AppSettings;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  reminders: Reminder[];
  onDeleteReminder: (id: string) => void;
  onPlayReminder: (channelId: string) => void;
  history: Channel[];
  lang: Language;
}

const TRANSLATIONS = {
  zh: {
    global: 'LOOQ',
    satellite: '数字电视',
    radio: '环球广播',
    saved: '收藏',
    logs: '历史',
    alert: '提醒',
    emptyLink: '无内容',
    scanPlaceholder: '输入地区/波段...',
    network: '节点',
    visuals: '视觉主题',
    import: '导入信源',
    uplinkActive: '链路正常'
  },
  en: {
    global: 'LOOQ',
    satellite: 'Sat TV',
    radio: 'Global Radio',
    saved: 'Saved',
    logs: 'History',
    alert: 'Alerts',
    emptyLink: 'Empty',
    scanPlaceholder: 'Region search...',
    network: 'Node',
    visuals: 'Visuals',
    import: 'Import Source',
    uplinkActive: 'Link Active'
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ 
    countries, selectedCountry, onSelectCountry, isOpen, onClose, mode, onModeChange, themes,
    currentTheme, onThemeChange, favorites, onSelectFavorite, onImportM3U, settings,
    onToggleSound, onOpenSettings, reminders, onDeleteReminder, onPlayReminder, history, lang
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemes, setShowThemes] = useState(false);
  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | null>('favorites');

  const t = TRANSLATIONS[lang];
  const { styles } = currentTheme;

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const lowerQ = searchQuery.toLowerCase();
    return countries.filter(c => c.name.toLowerCase().includes(lowerQ) || c.code.toLowerCase().includes(lowerQ));
  }, [countries, searchQuery]);

  const modeFavorites = useMemo(() => favorites.filter(c => (c.type || 'tv') === mode), [favorites, mode]);

  return (
    <>
        {isOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-xl" onClick={onClose} />}

        <aside className={`
            fixed md:relative z-50 h-full ${styles.bgSidebar} w-72 flex flex-col min-w-0
            transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            shadow-2xl
        `}>
        
        <div className={`p-6 border-b ${styles.border} flex items-center justify-between shrink-0`}>
            <div className={`flex items-center gap-4 ${styles.textMain}`}>
                <div className="p-2.5 bg-white text-black rounded-xl shadow-lg">
                    <Globe className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">{t.global}</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[7px] font-black tracking-widest uppercase opacity-30">{t.uplinkActive}</span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className={`md:hidden ${styles.textDim} p-2 hover:bg-white/5 rounded-full`}>
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-5 space-y-5 shrink-0">
            <div className={`flex p-1 ${styles.layoutShape} bg-black/20 border ${styles.border}`}>
                {(['tv', 'radio'] as const).map(m => (
                    <button 
                        key={m} onClick={() => onModeChange(m)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${styles.layoutShape} text-[9px] font-black transition-all uppercase tracking-widest ${mode === m ? styles.buttonActive : `${styles.textDim} hover:bg-white/5`}`}
                    >
                        {m === 'tv' ? <Tv className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
                        {m === 'tv' ? t.satellite : t.radio}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                {(['favorites', 'history'] as const).map((tab) => (
                    <button 
                        key={tab} onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                        className={`
                            flex-1 flex flex-col items-center justify-center py-2.5 ${styles.layoutShape} transition-all border
                            ${activeTab === tab ? styles.buttonActive : `${styles.card} border-transparent opacity-40 hover:opacity-100`}
                        `}
                    >
                        <span className="text-[8px] font-black uppercase tracking-widest">
                            {tab === 'favorites' ? t.saved : t.logs}
                        </span>
                    </button>
                ))}
            </div>

            {activeTab && (
                <div className={`p-3 ${styles.card} ${styles.layoutShape} border ${styles.border} space-y-1.5 max-h-40 overflow-y-auto animate-in slide-in-from-top-2 duration-300`}>
                    {activeTab === 'favorites' ? (
                        modeFavorites.length > 0 ? modeFavorites.map(ch => (
                            <button key={ch.id} onClick={() => { onSelectFavorite(ch); if (window.innerWidth < 768) onClose(); }} className={`w-full flex items-center gap-3 p-2.5 ${styles.layoutShape} hover:bg-white/10 text-left transition-all`}>
                                <div className="w-7 h-7 rounded-lg bg-black/60 shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                                    {ch.logo ? <img src={ch.logo} className="w-full h-full object-contain p-1" /> : <Star className="w-3 h-3 opacity-20" />}
                                </div>
                                <span className={`text-[9px] font-black truncate uppercase tracking-tight italic ${styles.textMain}`}>{ch.name}</span>
                            </button>
                        )) : <div className="py-6 text-center text-[8px] font-black opacity-20 uppercase">{t.emptyLink}</div>
                    ) : (
                        history.length > 0 ? history.map(ch => (
                            <button key={ch.id} onClick={() => { onSelectFavorite(ch); if (window.innerWidth < 768) onClose(); }} className={`w-full flex items-center gap-3 p-2.5 ${styles.layoutShape} hover:bg-white/10 text-left transition-all`}>
                                <div className="w-7 h-7 rounded-lg bg-black/60 shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                                    {ch.logo ? <img src={ch.logo} className="w-full h-full object-contain p-1" /> : <Star className="w-3 h-3 opacity-20" />}
                                </div>
                                <span className={`text-[9px] font-black truncate uppercase tracking-tight italic ${styles.textMain}`}>{ch.name}</span>
                            </button>
                        )) : <div className="py-6 text-center text-[8px] font-black opacity-20 uppercase">暂无历史</div>
                    )}
                </div>
            )}
        </div>

        <div className={`flex-1 overflow-y-auto px-5 space-y-1.5 scrollbar-thin`}>
            <div className={`sticky top-0 z-20 pt-1 pb-3 ${styles.bgSidebar}`}>
                <div className={`relative ${styles.input} ${styles.layoutShape} border ${styles.border} flex items-center px-4 py-2.5 shadow-sm`}>
                    <Search className={`w-3.5 h-3.5 ${styles.textDim}`} />
                    <input 
                        type="text" placeholder={t.scanPlaceholder}
                        className="bg-transparent border-none focus:outline-none text-[9px] w-full ml-2.5 font-black uppercase tracking-widest placeholder:opacity-20"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="space-y-1 pb-10">
                {filteredCountries.map(country => (
                    <button
                        key={country.code} onClick={() => { onSelectCountry(country); if (window.innerWidth < 768) onClose(); }}
                        className={`
                            w-full flex items-center gap-3.5 p-3.5 ${styles.layoutShape} transition-all group relative
                            ${selectedCountry?.code === country.code 
                                ? `${styles.buttonActive} shadow-lg scale-[1.01] border-none` 
                                : `${styles.textDim} hover:bg-white/5 border border-transparent`
                            }
                        `}
                    >
                        <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{country.flag}</span>
                        <div className="flex flex-col min-w-0">
                            <span className={`text-[10px] font-black truncate uppercase tracking-tighter italic ${selectedCountry?.code === country.code ? 'text-black' : styles.textMain}`}>{country.name}</span>
                            <span className={`text-[7px] font-black uppercase tracking-[0.1em] opacity-30 ${selectedCountry?.code === country.code ? 'text-black' : ''}`}>{country.code} {t.network}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <div className={`p-5 border-t ${styles.border} bg-black/10 space-y-3 relative`}>
            {showThemes && (
                 <div className="absolute bottom-[calc(100%+12px)] left-5 right-5 z-[100] p-3 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-3xl animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 gap-1.5">
                        {themes.map(t => (
                            <button 
                                key={t.id} onClick={() => { onThemeChange(t); setShowThemes(false); }} 
                                className={`
                                    w-full text-left px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-between
                                    ${currentTheme.id === t.id ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}
                                `}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        t.id === 'cyber' ? 'bg-cyan-400' : 
                                        t.id === 'candy' ? 'bg-rose-400' : 
                                        t.id === 'acid' ? 'bg-[#ccff00]' : 
                                        t.id === 'synth' ? 'bg-[#ff00ff]' :
                                        t.id === 'zen' ? 'bg-gray-400' : 'bg-yellow-400'
                                    }`}></div>
                                    {t.name[lang]}
                                </div>
                                {currentTheme.id === t.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </div>
                 </div>
            )}

            <button onClick={onImportM3U} className={`w-full flex items-center justify-center gap-2.5 py-3.5 ${styles.layoutShape} border ${styles.border} ${styles.button} text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white/5`}>
                <Link className="w-3.5 h-3.5" /> {t.import}
            </button>

            <div className="flex gap-2">
                <button onClick={() => setShowThemes(!showThemes)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[9px] font-black uppercase ${styles.button} ${styles.border} ${styles.layoutShape} ${showThemes ? 'bg-white text-black border-white' : ''}`}>
                    <Palette className="w-3.5 h-3.5" /> {t.visuals}
                </button>
                <button onClick={onOpenSettings} className={`p-3.5 ${styles.button} ${styles.border} ${styles.layoutShape} hover:bg-white/10`}>
                    <Settings className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
      </aside>
    </>
  );
};
