import React from 'react';
import { Channel, AppTheme } from '../types';
import { Star, Tv, Radio } from 'lucide-react';

interface FavoritesBarProps {
  favorites: Channel[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  theme: AppTheme;
  mode: 'tv' | 'radio';
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favorites,
  currentChannel,
  onSelectChannel,
  theme,
  mode
}) => {
  const { styles } = theme;
  const filteredFavorites = favorites.filter(c => (c.type || 'tv') === mode);

  // 极简提示条
  if (filteredFavorites.length === 0) {
      return (
        <div className={`w-full mb-2 shrink-0 flex items-center gap-2 py-2 px-3 rounded-lg border border-dashed ${styles.border} opacity-40 hover:opacity-80 transition-opacity cursor-default`}>
            <Star className="w-3 h-3" />
            <span className={`text-[10px] ${styles.textDim}`}>快捷收藏栏: 暂无内容</span>
        </div>
      );
  }

  return (
    <div className={`w-full mb-2 shrink-0 animate-in slide-in-from-left duration-500`}>
      <div className={`
        flex gap-2 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scroll-smooth snap-x items-center
        ${theme.type === 'web95' ? 'scrollbar-web95' : ''}
      `}>
        {/* 标题小标签 */}
        <div className={`shrink-0 text-[10px] font-bold writing-vertical-lr ${styles.textDim} opacity-50 hidden sm:block`}>
            FAV
        </div>

        {filteredFavorites.map(channel => {
            const isActive = currentChannel?.id === channel.id;
            return (
                <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel)}
                    className={`
                        group relative flex items-center gap-2 p-1.5 pr-3 shrink-0 max-w-[140px] snap-start
                        ${styles.layoutShape} transition-all duration-300 border border-transparent
                        ${isActive 
                            ? `${styles.buttonActive} shadow-md ring-1 ring-white/20 translate-y-0` 
                            : `${styles.button} hover:bg-white/10 hover:scale-[1.02]`}
                        ${theme.type === 'web95' && isActive ? 'border-white' : ''}
                    `}
                    title={channel.name}
                >
                    {/* Icon */}
                    <div className={`w-7 h-7 shrink-0 rounded flex items-center justify-center bg-black/20 overflow-hidden ${styles.border} border shadow-inner`}>
                        {channel.logo ? (
                            <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                            mode === 'tv' ? <Tv className="w-3.5 h-3.5 opacity-60" /> : <Radio className="w-3.5 h-3.5 opacity-60" />
                        )}
                    </div>
                    
                    {/* Name */}
                    <span className={`text-[11px] font-bold truncate ${isActive ? 'text-white' : styles.textMain}`}>
                        {channel.name}
                    </span>

                    {/* Active Indicator Dot */}
                    {isActive && (
                         <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 border border-white/50"></span>
                         </span>
                    )}
                </button>
            );
        })}
      </div>
    </div>
  );
};