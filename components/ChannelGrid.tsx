import React, { useState, useMemo } from 'react';
import { Channel, AppTheme } from '../types';
import { Tv, Search, ImageOff, Radio, Star, Play, Tag } from 'lucide-react';

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
  const { styles } = theme;

  // 1. 过滤 (搜索)
  const filteredChannels = useMemo(() => {
    if (!filter) return channels;
    return channels.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
  }, [channels, filter]);

  // 2. 分组 (只在没有搜索词时分组，搜索时平铺显示结果)
  const groupedChannels = useMemo(() => {
      if (filter) return null; // 搜索时不分组

      const groups: Record<string, Channel[]> = {};
      filteredChannels.forEach(c => {
          // 清理组名，例如 "Movies;Action" -> "Movies" (取第一个)
          let groupName = c.group ? c.group.split(';')[0].trim() : '其他 (Other)';
          if (!groupName) groupName = '其他 (Other)';
          
          if (!groups[groupName]) {
              groups[groupName] = [];
          }
          groups[groupName].push(c);
      });

      // 按组名排序
      return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredChannels, filter]);

  const isFavorite = (channel: Channel) => favorites.some(fav => fav.id === channel.id);

  if (loading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, sectionIdx) => (
            <div key={sectionIdx} className="space-y-3">
                <div className={`h-6 w-32 bg-white/5 ${styles.layoutShape} animate-pulse`}></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`bg-white/5 ${styles.layoutShape} h-24 animate-pulse`}></div>
                    ))}
                </div>
            </div>
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
    <div className="space-y-6">
      {/* 搜索栏 */}
      <div className={`sticky top-0 z-30 flex items-center gap-2 p-3 ${styles.layoutShape} ${styles.border} ${styles.bgMain} shadow-xl backdrop-blur-md bg-opacity-90`}>
        <Search className={`w-4 h-4 ${styles.textDim}`} />
        <input 
            type="text"
            placeholder={`在 ${channels.length} 个${mode === 'tv' ? '频道' : '电台'}中搜索...`}
            className={`bg-transparent border-none focus:outline-none text-sm w-full placeholder:${styles.textDim} ${styles.textMain}`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* 内容显示区域 */}
      <div className="min-h-[300px]">
          
          {/* 模式 A: 分组视图 (默认) */}
          {groupedChannels ? (
              <div className="space-y-10">
                  {groupedChannels.map(([groupName, groupItems]) => (
                      <div key={groupName} className="space-y-3">
                          {/* 分组标题 */}
                          <div className={`flex items-center gap-2 pb-2 border-b ${styles.border} opacity-90`}>
                              <Tag className={`w-4 h-4 ${styles.textDim}`} />
                              <h4 className={`text-base font-bold ${styles.textMain} uppercase tracking-wider`}>
                                  {groupName}
                              </h4>
                              <span className={`text-xs ${styles.textDim} font-normal bg-white/10 px-2 py-0.5 rounded-full`}>
                                  {groupItems.length}
                              </span>
                          </div>

                          {/* 分组网格 */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                              {groupItems.map(channel => (
                                  <ChannelCard 
                                      key={channel.id} 
                                      channel={channel} 
                                      currentChannel={currentChannel} 
                                      onSelectChannel={onSelectChannel} 
                                      isFavorite={isFavorite(channel)} 
                                      onToggleFavorite={onToggleFavorite} 
                                      mode={mode} 
                                      styles={styles}
                                  />
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              /* 模式 B: 搜索结果平铺视图 */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                {filteredChannels.length > 0 ? (
                    filteredChannels.map(channel => (
                        <ChannelCard 
                            key={channel.id} 
                            channel={channel} 
                            currentChannel={currentChannel} 
                            onSelectChannel={onSelectChannel} 
                            isFavorite={isFavorite(channel)} 
                            onToggleFavorite={onToggleFavorite} 
                            mode={mode} 
                            styles={styles}
                        />
                    ))
                ) : (
                    <div className={`col-span-full py-12 text-center ${styles.textDim}`}>
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>没有找到匹配 "{filter}" 的频道</p>
                    </div>
                )}
              </div>
          )}
      </div>
    </div>
  );
};

// 提取的卡片组件，保持代码整洁
const ChannelCard: React.FC<{
    channel: Channel;
    currentChannel: Channel | null;
    onSelectChannel: (c: Channel) => void;
    isFavorite: boolean;
    onToggleFavorite: (c: Channel) => void;
    mode: 'tv' | 'radio';
    styles: any;
}> = ({ channel, currentChannel, onSelectChannel, isFavorite, onToggleFavorite, mode, styles }) => {
    const isActive = currentChannel?.url === channel.url;
    
    return (
        <div
            className={`
            group relative flex flex-col transition-all duration-200 overflow-hidden h-full
            ${styles.layoutShape}
            ${isActive
                ? `${styles.buttonActive} ring-2 ring-offset-2 ring-offset-black/50 ring-current transform -translate-y-1 z-10 shadow-lg` 
                : `${styles.card} hover:bg-white/10 hover:-translate-y-1 hover:shadow-md`}
            `}
        >
            {/* 收藏按钮 */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(channel);
                }}
                className={`absolute top-1 right-1 z-20 p-1.5 rounded-full transition-all duration-200 
                    ${isFavorite 
                        ? 'text-yellow-400 bg-black/20' 
                        : 'text-white/20 hover:text-yellow-400 hover:bg-black/40'
                    }`}
                title="收藏频道"
            >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-yellow-400' : 'fill-none'}`} />
            </button>

            {/* 主点击区域 */}
            <button
                onClick={() => onSelectChannel(channel)}
                className="w-full flex flex-col items-center p-3 h-full text-center"
            >
                {/* Logo 容器 */}
                <div className={`
                    w-10 h-10 mb-3 ${styles.layoutShape} bg-black/20 p-1.5 
                    flex items-center justify-center overflow-hidden shadow-inner
                    transition-transform duration-300 group-hover:scale-110
                `}>
                    {channel.logo ? (
                        <img 
                            src={channel.logo} 
                            alt={channel.name} 
                            className="w-full h-full object-contain drop-shadow-sm"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.classList.add('fallback-icon');
                            }}
                        />
                    ) : (
                        mode === 'tv' ? <Tv className={`w-5 h-5 ${styles.textDim}`} /> : <Radio className={`w-5 h-5 ${styles.textDim}`} />
                    )}
                    {/* 这里用于处理图片加载失败后的回退显示 */}
                    <div className="hidden fallback-icon">
                        {mode === 'tv' ? <Tv className={`w-5 h-5 ${styles.textDim}`} /> : <Radio className={`w-5 h-5 ${styles.textDim}`} /> }
                    </div>
                </div>
                
                {/* 频道名称 */}
                <span className={`text-xs font-medium leading-tight line-clamp-2 w-full ${isActive ? 'text-white font-bold' : styles.textMain}`}>
                    {channel.name}
                </span>
                
                {/* 播放状态指示 (仅激活时显示) */}
                {isActive && (
                    <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-green-400 font-mono animate-pulse">
                        <Play className="w-2 h-2 fill-current" /> Playing
                    </div>
                )}
            </button>
            
            {/* 底部高亮条 */}
            {isActive && (
                 <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
            )}
        </div>
    );
};