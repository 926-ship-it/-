
import React, { useState } from 'react';
import { Channel, AppTheme } from '../types';
import { Star, Tv, Radio, Activity } from 'lucide-react';

interface FavoritesBarProps {
  favorites: Channel[];
  currentChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  theme: AppTheme;
  mode: 'tv' | 'radio';
}

const FavLogo = ({ src, mode, isActive }: { src: string | null, mode: string, isActive: boolean }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(src ? 'loading' : 'error');

  if (status === 'error' || !src) {
    return mode === 'tv' ? <Tv className="w-3 h-3 opacity-60" /> : <Radio className="w-3 h-3 opacity-60" />;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {status === 'loading' && <Activity className="w-3 h-3 animate-pulse opacity-20 absolute" />}
      <img 
        src={src} 
        className={`w-full h-full object-contain p-0.5 transition-opacity duration-300 ${status === 'success' ? 'opacity-100' : 'opacity-0'}`} 
        onLoad={() => setStatus('success')}
        onError={() => setStatus('error')}
        loading="lazy"
      />
    </div>
  );
};

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favorites,
  currentChannel,
  onSelectChannel,
  theme,
  mode
}) => {
  const { styles } = theme;
  const filteredFavorites = favorites.filter(c => (c.type || 'tv') === mode);

  if (filteredFavorites.length === 0) {
      return (
        <div className={`w-full mb-1 shrink-0 flex items-center gap-2 py-1.5 px-3 rounded-lg border border-dashed ${styles.border} opacity-30 hover:opacity-60 transition-opacity cursor-default`}>
            <Star className="w-2.5 h-2.5" />
            <span className={`text-[9px] md:text-[10px] ${styles.textDim}`}>快捷收藏: 暂无内容</span>
        </div>
      );
  }

  return (
    <div className={`w-full mb-1 shrink-0 animate-in slide-in-from-left duration-500`}>
      <div className={`
        flex gap-1.5 md:gap-2 overflow-x-auto pb-2 pt-1 px-1 scrollbar-none no-scrollbar snap-x items-center
      `}>
        <div className={`shrink-0 text-[9px] font-black writing-vertical-lr ${styles.textDim} opacity-30 hidden sm:block uppercase`}>
            FAV
        </div>

        {filteredFavorites.map(channel => {
            const isActive = currentChannel?.id === channel.id;
            return (
                <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel)}
                    className={`
                        group relative flex items-center gap-2 p-1 md:p-1.5 pr-2.5 md:pr-4 shrink-0 max-w-[120px] md:max-w-[160px] snap-start
                        ${styles.layoutShape} transition-all duration-300 border border-transparent
                        ${isActive 
                            ? `${styles.buttonActive} shadow-lg ring-1 ring-white/10` 
                            : `${styles.button} hover:bg-white/10`}
                    `}
                    title={channel.name}
                >
                    <div className={`w-6 h-6 md:w-7 md:h-7 shrink-0 rounded flex items-center justify-center bg-black/20 overflow-hidden ${styles.border} border shadow-inner`}>
                        <FavLogo src={channel.logo} mode={mode} isActive={isActive} />
                    </div>
                    
                    <span className={`text-[10px] md:text-[11px] font-bold truncate ${isActive ? 'text-white' : styles.textMain}`}>
                        {channel.name}
                    </span>

                    {isActive && (
                         <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500 border border-white/50"></span>
                         </span>
                    )}
                </button>
            );
        })}
      </div>
    </div>
  );
};
