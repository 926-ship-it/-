
import React from 'react';
import { Channel, AppTheme } from '../types';
import { Star, Tv, Radio, Play } from 'lucide-react';

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

  // 如果没有收藏，显示一个极其简约的提示，不占太多空间
  if (filteredFavorites.length === 0) {
      return (
        <div className={`w-full mb-4 shrink-0 flex items-center gap-2 py-3 px-4 rounded-xl border border-dashed ${styles.border} opacity-50`}>
            <Star className="w-4 h-4" />
            <span className={`text-xs ${styles.textDim}`}>快捷收藏栏: 点击频道旁的星星即可固定在此处</span>
        </div>
      );
  }

  return (
    <div className={`w-full mb-4 shrink-0 animate-in slide-in-from-left duration-500`}>
      <div className={`
        flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scroll-smooth snap-x
        ${theme.type === 'web95' ? 'scrollbar-web95' : ''}
      `}>
        {filteredFavorites.map(channel => {
            const isActive = currentChannel?.id === channel.id;
            return (
                <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel)}
                    className={`
                        group relative flex items-center gap-3 p-2 pr-4 shrink-0 min-w-[140px] snap-start
                        ${styles.layoutShape} transition-all duration-300
                        ${isActive 
                            ? `${styles.buttonActive} shadow-lg ring-1 ring-white/20 translate-y-0` 
                            : `${styles.button} hover:bg-white/10 hover:-translate-y-1`}
                        ${theme.type === 'web95' && isActive ? 'border-2 border-white' : ''}
                    `}
                >
                    <div className={`w-10 h-10 shrink-0 rounded flex items-center justify-center bg-black/20 overflow-hidden ${styles.border} border shadow-inner`}>
                        {channel.logo ? (
                            <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                            mode === 'tv' ? <Tv className="w-5 h-5 opacity-50" /> : <Radio className="w-5 h-5 opacity-50" />
                        )}
                    </div>
                    
                    <div className="flex flex-col items-start min-w-0">
                         <span className={`text-xs font-bold truncate w-full text-left ${isActive ? 'text-white' : styles.textMain}`}>
                            {channel.name}
                        </span>
                        {isActive && (
                             <span className="text-[10px] text-green-400 flex items-center gap-1">
                                 <Play className="w-2 h-2 fill-current" /> Playing
                             </span>
                        )}
                    </div>
                </button>
            );
        })}
      </div>
    </div>
  );
};
