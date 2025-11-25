
import React, { useState, useMemo } from 'react';
import { Channel, AppTheme } from '../types';
import { Tv, Search, ImageOff, Radio, Star, Play } from 'lucide-react';

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
    channels, 
    currentChannel, 
    onSelectChannel,
    loading,
    mode,
    theme,
    favorites,
    onToggleFavorite
}) => {
  const [filter, setFilter] = useState('');

  const filteredChannels = useMemo(() => {
    if (!filter) return channels;
    return channels.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
  }, [channels, filter]);

  const isFavorite = (channel: Channel) => favorites.some(fav => fav.id === channel.id);
  const { styles } = theme;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`bg-white/5 ${styles.layoutShape} h-20 animate-pulse`}></div>
        ))}
      </div>
    );
  }

  if (channels.length === 0) {
      return (
          <div className={`flex flex-col items-center justify-center py-20 ${styles.textDim} bg-white/5 rounded-3xl border border-dashed ${styles.border}`}>
              {mode === 'tv' ? (
                <Tv className="w-16 h-16 mb-4 opacity-20" />
              ) : (
                <Radio className="w-16 h-16 mb-4 opacity-20" />
              )}
              <p className="text-lg font-medium">该地区暂无{mode === 'tv' ? '电视频道' : '广播电台'}数据</p>
          </div>
      );
  }

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className={`flex items-center gap-2 p-3 ${styles.layoutShape} ${styles.border} ${styles.input} w-full`}>
        <Search className={`w-4 h-4 ${styles.textDim}`} />
        <input 
            type="text"
            placeholder={`在 ${channels.length} 个${mode === 'tv' ? '频道' : '电台'}中搜索...`}
            className={`bg-transparent border-none focus:outline-none text-sm w-full placeholder:${styles.textDim} ${styles.textMain}`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
        {filteredChannels.map(channel => {
            const isActive = currentChannel?.url === channel.url;
            const fav = isFavorite(channel);
            
            return (
                <div
                    key={channel.id || channel.url} 
                    className={`
                    group relative flex flex-col transition-all duration-200 overflow-hidden
                    ${styles.layoutShape}
                    ${isActive
                        ? `${styles.buttonActive} ring-2 ring-offset-2 ring-offset-black/50 ring-current transform -translate-y-1 z-10` 
                        : `${styles.card} hover:bg-white/10 hover:-translate-y-0.5`}
                    `}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(channel);
                        }}
                        className={`absolute top-1 right-1 z-20 p-1.5 rounded-full transition-colors ${fav ? 'text-yellow-400' : 'text-transparent group-hover:text-white/30 hover:!text-yellow-400'}`}
                    >
                        <Star className={`w-3.5 h-3.5 ${fav ? 'fill-yellow-400' : 'fill-current'}`} />
                    </button>

                    <button
                        onClick={() => onSelectChannel(channel)}
                        className="w-full flex flex-col items-center p-3 h-full text-center"
                    >
                        <div className={`w-10 h-10 mb-2 ${styles.layoutShape} bg-black/20 p-1.5 flex items-center justify-center overflow-hidden shadow-inner`}>
                            {channel.logo ? (
                                <img 
                                    src={channel.logo} 
                                    alt={channel.name} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.classList.add('fallback-icon');
                                    }}
                                />
                            ) : (
                                mode === 'tv' ? <Tv className={`w-5 h-5 ${styles.textDim}`} /> : <Radio className={`w-5 h-5 ${styles.textDim}`} />
                            )}
                            <div className="hidden fallback-icon">
                                <ImageOff className={`w-4 h-4 ${styles.textDim}`} />
                            </div>
                        </div>
                        
                        <span className={`text-xs font-medium leading-tight line-clamp-2 w-full ${isActive ? 'text-white' : styles.textMain}`}>
                            {channel.name}
                        </span>
                        
                        <div className={`mt-auto pt-2 text-[10px] ${styles.textDim} opacity-60 truncate w-full`}>
                            {channel.group || 'Live'}
                        </div>
                    </button>
                    
                    {isActive && (
                         <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
