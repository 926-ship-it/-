
import React, { useState, useMemo, useEffect } from 'react';
import { Channel, AppTheme } from '../types';
import { Tv, Search, Radio, Star, Play, Activity, Globe2, X, Image as ImageIcon } from 'lucide-react';

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

const LogoImage = ({ src, name, isActive, mode }: { src: string | null, name: string, isActive: boolean, mode: string }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(src ? 'loading' : 'error');

  useEffect(() => {
    if (!src) setStatus('error');
    else setStatus('loading');
  }, [src]);

  if (status === 'error' || !src) {
    return mode === 'tv' ? <Tv className={`w-6 h-6 md:w-8 h-8 ${isActive ? 'text-black' : 'opacity-20'}`} /> : <Radio className={`w-6 h-6 md:w-8 h-8 ${isActive ? 'text-black' : 'opacity-20'}`} />;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-4 h-4 animate-pulse opacity-20" />
        </div>
      )}
      <img 
        src={src} 
        alt={name}
        className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${status === 'success' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('success')}
        onError={() => setStatus('error')}
        loading="lazy"
      />
    </div>
  );
};

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-6">
        {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`h-28 md:h-40 bg-white/5 ${styles.layoutShape} animate-pulse relative overflow-hidden border border-white/5`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer"></div>
            </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8">
      <div className={`flex items-center gap-3 md:gap-6 p-3 md:p-5 ${styles.input} ${styles.layoutShape} border ${styles.border} transition-all`}>
        <Search className={`w-4 h-4 md:w-5 md:h-5 ${styles.textDim}`} />
        <input 
            type="text"
            placeholder="搜索全球信道..."
            className="bg-transparent border-none focus:outline-none text-[11px] md:text-[14px] font-bold w-full placeholder:opacity-30 uppercase tracking-widest"
            value={internalFilter}
            onChange={(e) => {
                setInternalFilter(e.target.value);
                if (onExternalFilterChange) onExternalFilterChange('');
            }}
        />
        {(internalFilter || externalFilter) && (
            <button onClick={() => { setInternalFilter(''); if (onExternalFilterChange) onExternalFilterChange(''); }} className="p-1 text-rose-500 rounded-full">
                <X className="w-4 h-4" />
            </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 md:gap-6">
          {filteredChannels.length > 0 ? filteredChannels.map(channel => {
              const isActive = currentChannel?.id === channel.id;
              const isFav = favorites.some(f => f.id === channel.id);
              
              return (
                  <div
                      key={channel.id}
                      onClick={() => onSelectChannel(channel)}
                      className={`
                        group relative p-3 md:p-6 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
                        border ${styles.layoutShape} active:scale-95 touch-manipulation
                        ${isActive 
                            ? `${styles.buttonActive} shadow-xl scale-[1.02] z-10 border-transparent` 
                            : `${styles.card} hover:bg-white/5 md:hover:-translate-y-1`}
                      `}
                  >
                      {isFav && !isActive && (
                          <div className="absolute top-1.5 right-1.5 text-amber-500 opacity-60">
                              <Star className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 fill-current" />
                          </div>
                      )}

                      <div className={`w-10 h-10 md:w-16 md:h-16 mb-2 md:mb-5 rounded-xl md:rounded-3xl flex items-center justify-center overflow-hidden transition-all shadow-inner relative ${isActive ? 'bg-white/20' : 'bg-black/30 border border-white/5'}`}>
                          <LogoImage src={channel.logo} name={channel.name} isActive={isActive} mode={mode} />
                      </div>
                      
                      <div className="flex flex-col gap-0.5 w-full">
                          <span className={`text-[9px] md:text-[12px] font-black tracking-tighter line-clamp-1 md:line-clamp-2 uppercase italic leading-tight ${isActive ? 'text-black' : styles.textMain}`}>
                              {channel.name}
                          </span>
                          <span className={`text-[6px] md:text-[9px] font-black uppercase tracking-widest opacity-20 ${isActive ? 'text-black/60' : styles.textDim}`}>
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
