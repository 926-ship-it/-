
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
        {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`h-32 md:h-40 bg-white/5 ${styles.layoutShape} animate-pulse relative overflow-hidden border border-white/5`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer"></div>
            </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10">
      <div className={`flex items-center gap-4 md:gap-6 p-4 md:p-6 ${styles.input} ${styles.layoutShape} border ${styles.border} group transition-all`}>
        <Search className={`w-5 h-5 md:w-6 h-6 ${styles.textDim}`} />
        <input 
            type="text"
            placeholder={lang => lang === 'zh' ? '搜索全球信道...' : 'Search nodes...'}
            className="bg-transparent border-none focus:outline-none text-[12px] md:text-[14px] font-bold w-full placeholder:opacity-30 uppercase tracking-widest"
            value={internalFilter}
            onChange={(e) => {
                setInternalFilter(e.target.value);
                if (onExternalFilterChange) onExternalFilterChange('');
            }}
        />
        {(internalFilter || externalFilter) && (
            <button onClick={() => { setInternalFilter(''); if (onExternalFilterChange) onExternalFilterChange(''); }} className="p-2 text-rose-500 rounded-full">
                <X className="w-5 h-5" />
            </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-6">
          {filteredChannels.length > 0 ? filteredChannels.map(channel => {
              const isActive = currentChannel?.id === channel.id;
              const isFav = favorites.some(f => f.id === channel.id);
              
              return (
                  <div
                      key={channel.id}
                      onClick={() => onSelectChannel(channel)}
                      className={`
                        group relative p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
                        border ${styles.layoutShape} active:scale-95
                        ${isActive 
                            ? `${styles.buttonActive} shadow-[0_20px_40px_rgba(0,0,0,0.4)] scale-105 z-10 border-transparent` 
                            : `${styles.card} hover:bg-white/5 hover:-translate-y-1`}
                      `}
                  >
                      {isFav && !isActive && (
                          <div className="absolute top-2 right-2 text-amber-500 opacity-60">
                              <Star className="w-3 h-3 md:w-4 h-4 fill-current" />
                          </div>
                      )}

                      <div className={`w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-5 rounded-2xl md:rounded-3xl flex items-center justify-center overflow-hidden transition-all shadow-inner relative ${isActive ? 'bg-white/20' : 'bg-black/30 border border-white/5'}`}>
                          {channel.logo ? (
                              <img src={channel.logo} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" loading="lazy" />
                          ) : (
                              mode === 'tv' ? <Tv className={`w-6 h-6 md:w-8 h-8 ${isActive ? 'text-black' : 'opacity-20'}`} /> : <Radio className={`w-6 h-6 md:w-8 h-8 ${isActive ? 'text-black' : 'opacity-20'}`} />
                          )}
                      </div>
                      
                      <div className="flex flex-col gap-1 w-full">
                          <span className={`text-[10px] md:text-[12px] font-black tracking-tighter line-clamp-1 md:line-clamp-2 uppercase italic leading-tight ${isActive ? 'text-black' : styles.textMain}`}>
                              {channel.name}
                          </span>
                          <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-20 ${isActive ? 'text-black/60' : styles.textDim}`}>
                              {channel.group || 'Public'}
                          </span>
                      </div>
                  </div>
              );
          }) : (
              <div className="col-span-full py-20 text-center opacity-20 font-black uppercase tracking-widest text-[10px] md:text-sm">
                  未匹配到有效终端信道
              </div>
          )}
      </div>
    </div>
  );
};
