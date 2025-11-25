
import React, { useState, useMemo, useRef } from 'react';
import { Country, AppTheme, Channel, AppSettings } from '../types';
import { Search, Globe, X, Tv, Radio, Palette, Star, Upload, Volume2, VolumeX, Settings } from 'lucide-react';

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
    onToggleSound
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemes, setShowThemes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
      return favorites.filter(c => c.type === mode);
  }, [favorites, mode]);

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
            transition-all duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${styles.shadow}
        `}>
        <div className={`p-4 border-b ${styles.border} flex items-center justify-between`}>
            <div className={`flex items-center gap-2 ${styles.textMain}`}>
                <Globe className="w-6 h-6" />
                <h1 className="text-xl font-bold tracking-tight">全球看听</h1>
            </div>
            <button onClick={onClose} className={`md:hidden ${styles.textDim} hover:${styles.textMain}`}>
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-4 space-y-3">
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

            {/* Settings Toggles */}
            <div>
                 <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm ${styles.button} ${styles.border} ${styles.layoutShape}`}
                 >
                    <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> 设置</span>
                    <span>{showSettings ? '▲' : '▼'}</span>
                 </button>
                 
                 {showSettings && (
                    <div className={`mt-2 p-2 ${styles.card} ${styles.layoutShape} flex flex-col gap-2 z-10`}>
                        <button
                            onClick={onToggleSound}
                            className={`flex items-center justify-between w-full px-3 py-2 text-xs ${styles.layoutShape} ${styles.button} hover:bg-white/5 transition-colors`}
                        >
                            <span className="flex items-center gap-2">
                                {settings.enableSound ? <Volume2 className="w-3 h-3 text-green-500" /> : <VolumeX className="w-3 h-3 text-red-500" />}
                                信号连接提示音
                            </span>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${settings.enableSound ? 'bg-green-500' : 'bg-gray-600'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${settings.enableSound ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </button>
                    </div>
                 )}
            </div>

            {/* Theme Selector */}
            <div>
                 <button 
                    onClick={() => setShowThemes(!showThemes)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm ${styles.button} ${styles.border} ${styles.layoutShape}`}
                 >
                    <span className="flex items-center gap-2"><Palette className="w-4 h-4" /> 风格切换</span>
                    <span>{showThemes ? '▲' : '▼'}</span>
                 </button>
                 
                 {showThemes && (
                    <div className={`mt-2 p-2 ${styles.card} ${styles.layoutShape} grid grid-cols-1 gap-1 z-10`}>
                        {themes.map(t => (
                            <button
                                key={t.id}
                                onClick={() => onThemeChange(t)}
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

            <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 py-2 ${styles.layoutShape} ${styles.border} ${styles.button} text-xs transition-colors`}
            >
                <Upload className="w-3 h-3" /> 导入 M3U 列表
            </button>
            <input 
                type="file" 
                accept=".m3u,.m3u8" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
            />

            <div className="relative">