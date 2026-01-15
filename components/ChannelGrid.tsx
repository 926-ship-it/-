
import React, { useState, useMemo } from 'react';
import { Channel, AppTheme } from '../types';
import { Tv, Search, Radio, Star, Play, Activity, Globe2 } from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  loading: boolean;
  mode: 'tv' | 'radio';
  theme: AppTheme;
  favorites: Channel[];
  onToggleFavorite: (channel: Channel) => void;
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({ 
    channels, currentChannel, onSelectChannel, loading, mode, theme, favorites, onToggleFavorite
}) => {
  const [filter, setFilter] = useState('');
  const { styles } = theme;

  const filteredChannels = useMemo(() => {
    if (!filter) return channels;
    const q = filter.toLowerCase();
    return channels.filter(c => c.name.toLowerCase().includes(q) || (c.group && c.group.toLowerCase().includes(q)));
  }, [channels, filter]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className={`h-24 bg-white/5 rounded-xl animate-pulse`}></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`flex items-center gap-3 p-3.5 ${styles.input} ${styles.layoutShape} border ${styles.border} shadow-inner`}>
        <Search className={`w-4 h-4 ${styles.textDim}`} />
        <input 
            type="text"
            placeholder="搜索全站频道..."
            className="bg-transparent border-none focus:outline-none text-[11px] font-bold w-full placeholder:opacity-40 uppercase tracking-widest"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredChannels.length > 0 ? filteredChannels.map(channel => {
              const isActive = currentChannel?.id === channel.id;
              
              return (
                  <div
                      key={channel.id}
                      onClick={() => onSelectChannel(channel)}
                      className={`
                        group relative p-3 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
                        border ${styles.layoutShape} min-w-0
                        ${isActive 
                            ? `${styles.buttonActive} shadow-lg scale-[1.02]` 
                            : `${styles.card} hover:scale-[1.02]`}
                      `}
                  >
                      <div className={`w-10 h-10 mb-2 rounded-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 bg-black/20`}>
                          {channel.logo ? (
                              <img src={channel.logo} className="w-full h-full object-contain p-1.5" loading="lazy" />
                          ) : (
                              mode === 'tv' ? <Tv className="w-4 h-4 opacity-40" /> : <Radio className="w-4 h-4 opacity-40" />
                          )}
                      </div>
                      
                      <span className={`text-[10px] font-black tracking-tighter line-clamp-2 uppercase min-w-0 ${isActive ? 'text-inherit' : styles.textMain}`}>
                          {channel.name}
                      </span>

                      {isActive && (
                          <div className="absolute top-2 right-2">
                              <span className="flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                          </div>
                      )}
                  </div>
              );
          }) : (
              <div className="col-span-full py-16 text-center opacity-20 font-black uppercase italic tracking-widest text-[10px]">
                  未找到任何可用频率
              </div>
          )}
      </div>
    </div>
  );
};
