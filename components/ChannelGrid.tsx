
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className={`h-32 bg-white/5 ${styles.layoutShape} animate-pulse relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-shimmer"></div>
            </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`flex items-center gap-4 p-4 ${styles.input} ${styles.layoutShape} border ${styles.border} shadow-2xl group transition-all`}>
        <Search className={`w-5 h-5 ${styles.textDim} group-focus-within:text-cyan-400 transition-colors`} />
        <input 
            type="text"
            placeholder={externalFilter ? `Search global tag: ${externalFilter}` : "Find channels, topics or genres..."}
            className="bg-transparent border-none focus:outline-none text-[13px] font-bold w-full placeholder:opacity-30 uppercase tracking-widest"
            value={internalFilter}
            onChange={(e) => {
                setInternalFilter(e.target.value);
                if (onExternalFilterChange) onExternalFilterChange('');
            }}
        />
        <div className="hidden md:flex items-center gap-1 opacity-20 group-focus-within:opacity-0 transition-opacity">
            <Command className="w-3 h-3" /> <span className="text-[9px] font-black">S</span>
        </div>
        {(internalFilter || externalFilter) && (
            <button onClick={() => { setInternalFilter(''); if (onExternalFilterChange) onExternalFilterChange(''); }} className="p-2 hover:bg-rose-500/20 text-rose-500 rounded-full transition-colors">
                <X className="w-4 h-4" />
            </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredChannels.length > 0 ? filteredChannels.map(channel => {
              const isActive = currentChannel?.id === channel.id;
              const isFav = favorites.some(f => f.id === channel.id);
              
              return (
                  <div
                      key={channel.id}
                      onClick={() => onSelectChannel(channel)}
                      className={`
                        group relative p-5 flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer
                        border ${styles.layoutShape} min-w-0 active:scale-95
                        ${isActive 
                            ? `${styles.buttonActive} shadow-[0_20px_40px_rgba(0,0,0,0.4)] scale-105 z-10 border-transparent` 
                            : `${styles.card} ${styles.cardHover} hover:scale-105`}
                      `}
                  >
                      {/* Favorite Marker */}
                      {isFav && !isActive && (
                          <div className="absolute top-2 right-2 text-amber-500 opacity-60">
                              <Star className="w-3 h-3 fill-current" />
                          </div>
                      )}

                      <div className={`w-14 h-14 mb-4 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:rotate-3 shadow-inner ${isActive ? 'bg-white/20' : 'bg-black/40 border border-white/5'}`}>
                          {channel.logo ? (
                              <img src={channel.logo} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" loading="lazy" />
                          ) : (
                              mode === 'tv' ? <Tv className={`w-6 h-6 ${isActive ? 'text-black' : 'opacity-20'}`} /> : <Radio className={`w-6 h-6 ${isActive ? 'text-black' : 'opacity-20'}`} />
                          )}
                      </div>
                      
                      <div className="flex flex-col gap-1 w-full">
                          <span className={`text-[11px] font-black tracking-tighter line-clamp-2 uppercase italic leading-tight ${isActive ? 'text-black' : styles.textMain}`}>
                              {channel.name}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-60 transition-opacity ${isActive ? 'text-black/60' : styles.textDim}`}>
                              {channel.group || 'NODE'}
                          </span>
                      </div>

                      {isActive && (
                          <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
                      )}
                  </div>
              );
          }) : (
              <div className="col-span-full py-24 text-center">
                  <Globe2 className="w-16 h-16 mx-auto mb-6 opacity-5 animate-pulse" />
                  <div className="opacity-20 font-black uppercase italic tracking-[0.4em] text-xs">
                      No matching frequencies found
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
