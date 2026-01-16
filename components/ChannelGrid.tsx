
import React, { useState, useMemo, useEffect } from 'react';
import { Channel, AppTheme } from '../types';
import { Tv, Search, Radio, Star, Play, Activity, Globe2, X, Command } from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  loading: boolean;
  mode: 'tv' | 'radio';
  theme: AppTheme;
  favorites: Channel[];
  onToggleFavorite: (channel: Channel) => void;
  externalFilter?: string;
  onExternalFilterChange?: (filter: string) => void;
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({ 
    channels, currentChannel, onSelectChannel, loading, mode, theme, favorites, onToggleFavorite,
    externalFilter = '', onExternalFilterChange
}) => {
  const [internalFilter, setInternalFilter] = useState('');
  const { styles } = theme;

  useEffect(() => { if (externalFilter) setInternalFilter(''); }, [externalFilter]);

  const filteredChannels = useMemo(() => {
    const activeFilter = (externalFilter || internalFilter).toLowerCase();
    if (!activeFilter) return channels;
    return channels.filter(c => c.name.toLowerCase().includes(activeFilter) || (c.group && c.group.toLowerCase().includes(activeFilter)));
  }, [channels, externalFilter, internalFilter]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className={`h-40 bg-white/5 ${styles.layoutShape} animate-pulse relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer"></div>
            </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className={`flex items-center gap-6 p-6 ${styles.input} ${styles.layoutShape} border ${styles.border} shadow-3xl group transition-all duration-500 hover:border-white/20`}>
        <Search className={`w-6 h-6 ${styles.textDim} group-focus-within:text-cyan-400 transition-colors`} />
        <input 
            type="text"
            placeholder={externalFilter ? `节点过滤: ${externalFilter}` : "输入波段、频道名称或分类关键词..."}
            className="bg-transparent border-none focus:outline-none text-[14px] font-bold w-full placeholder:opacity-30 uppercase tracking-widest"
            value={internalFilter}
            onChange={(e) => {
                setInternalFilter(e.target.value);
                if (onExternalFilterChange) onExternalFilterChange('');
            }}
        />
        <div className="hidden md:flex items-center gap-2 opacity-20 group-focus-within:opacity-0 transition-opacity">
            <Command className="w-4 h-4" /> <span className="text-[10px] font-black">SEARCH</span>
        </div>
        {(internalFilter || externalFilter) && (
            <button onClick={() => { setInternalFilter(''); if (onExternalFilterChange) onExternalFilterChange(''); }} className="p-3 hover:bg-rose-500/20 text-rose-500 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredChannels.length > 0 ? filteredChannels.map(channel => {
              const isActive = currentChannel?.id === channel.id;
              const isFav = favorites.some(f => f.id === channel.id);
              
              return (
                  <div
                      key={channel.id}
                      onClick={() => onSelectChannel(channel)}
                      className={`
                        group relative p-6 flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer
                        border ${styles.layoutShape} min-w-0 active:scale-95 animate-in fade-in duration-700
                        ${isActive 
                            ? `${styles.buttonActive} shadow-[0_25px_50px_rgba(0,0,0,0.5)] scale-110 z-10 border-transparent animate-breathe` 
                            : `${styles.card} ${styles.cardHover} hover:scale-105 hover:-translate-y-2`}
                      `}
                  >
                      {/* Favorite Marker */}
                      {isFav && !isActive && (
                          <div className="absolute top-3 right-3 text-amber-500 opacity-60">
                              <Star className="w-4 h-4 fill-current animate-pulse" />
                          </div>
                      )}

                      <div className={`w-16 h-16 mb-5 rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:rotate-6 shadow-inner relative ${isActive ? 'bg-white/20' : 'bg-black/30 border border-white/5'}`}>
                          {channel.logo ? (
                              <img src={channel.logo} className="w-full h-full object-contain p-2.5 group-hover:scale-110 transition-transform" loading="lazy" />
                          ) : (
                              mode === 'tv' ? <Tv className={`w-8 h-8 ${isActive ? 'text-black' : 'opacity-20'}`} /> : <Radio className={`w-8 h-8 ${isActive ? 'text-black' : 'opacity-20'}`} />
                          )}
                          {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full">
                          <span className={`text-[12px] font-black tracking-tighter line-clamp-2 uppercase italic leading-tight ${isActive ? 'text-black' : styles.textMain}`}>
                              {channel.name}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-30 group-hover:opacity-60 transition-opacity ${isActive ? 'text-black/60' : styles.textDim}`}>
                              {channel.group || '频道'}
                          </span>
                      </div>

                      {isActive && (
                          <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-white rounded-full shadow-[0_0_15px_#fff]"></div>
                      )}
                  </div>
              );
          }) : (
              <div className="col-span-full py-32 text-center">
                  <Globe2 className="w-20 h-20 mx-auto mb-8 opacity-5 animate-pulse" />
                  <div className="opacity-20 font-black uppercase italic tracking-[0.6em] text-sm">
                      未锁定匹配信道
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
