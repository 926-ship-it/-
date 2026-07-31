
import React, { useState, useMemo, useEffect } from 'react';
import { Channel, AppTheme, Language } from '../types';
import { Tv, Search, Radio, Star, Play, Activity, Globe2, X, ShieldCheck, RefreshCw, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

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
  isCleaning?: boolean;
  cleanProgress?: { tested: number; total: number; validCount: number } | null;
  cleanSummary?: string | null;
  onCleanChannels?: () => void;
  lang?: Language;
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
    externalFilter = '', onExternalFilterChange,
    isCleaning = false, cleanProgress = null, cleanSummary = null, onCleanChannels, lang = 'zh'
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-6">
        {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`h-28 md:h-36 bg-white/5 ${styles.layoutShape} animate-pulse relative overflow-hidden border border-white/5`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer"></div>
            </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className={`flex-1 flex items-center gap-3 md:gap-4 p-2.5 md:p-3.5 ${styles.input} ${styles.layoutShape} border ${styles.border} transition-all`}>
          <Search className={`w-4 h-4 md:w-5 md:h-5 ${styles.textDim}`} />
          <input 
              type="text"
              placeholder={lang === 'zh' ? "搜索频道名称或类别..." : "Search channels..."}
              className="bg-transparent border-none focus:outline-none text-[11px] md:text-[13px] font-bold w-full placeholder:opacity-30 uppercase tracking-widest"
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

        {onCleanChannels && channels.length > 0 && (
          <button
            onClick={onCleanChannels}
            disabled={isCleaning}
            className={`
              flex items-center justify-center gap-2 px-3.5 md:px-5 py-2.5 md:py-3.5 ${styles.layoutShape}
              text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all shrink-0
              ${isCleaning 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 cursor-wait' 
                : `${styles.button} border ${styles.border} hover:border-cyan-400 hover:text-cyan-400 active:scale-95`}
            `}
          >
            {isCleaning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-cyan-400" />
                <span>{lang === 'zh' ? '检测中...' : 'Checking...'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />
                <span>{lang === 'zh' ? '清理播放失败频道' : 'Clean Dead Channels'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress & Summary Bar */}
      {isCleaning && cleanProgress && (
        <div className={`p-3 md:p-4 ${styles.layoutShape} bg-cyan-950/40 border border-cyan-500/30 flex flex-col gap-2 text-cyan-300 animate-fade-in`}>
          <div className="flex items-center justify-between text-[10px] md:text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>{lang === 'zh' ? '正在智能检测信号并净化列表...' : 'Checking stream status and purging dead links...'}</span>
            </div>
            <span className="font-mono">{cleanProgress.tested} / {cleanProgress.total}</span>
          </div>
          <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full transition-all duration-200"
              style={{ width: `${Math.min(100, Math.round((cleanProgress.tested / cleanProgress.total) * 100))}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-cyan-400/70 text-right">
            {lang === 'zh' ? `已保留 ${cleanProgress.validCount} 个正常波段` : `Valid streams: ${cleanProgress.validCount}`}
          </div>
        </div>
      )}

      {cleanSummary && !isCleaning && (
        <div className={`p-3 md:p-4 ${styles.layoutShape} bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-emerald-300 animate-fade-in`}>
          <div className="flex items-center gap-2.5 text-[10px] md:text-xs font-bold tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cleanSummary}</span>
          </div>
          <span className="text-[9px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
            {channels.length} {lang === 'zh' ? '个可用波段' : 'channels active'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 md:gap-4">
          {filteredChannels.length > 0 ? filteredChannels.map(channel => {
              const isActive = currentChannel?.id === channel.id;
              const isFav = favorites.some(f => f.id === channel.id);
              
              return (
                  <div
                      key={channel.id}
                      onClick={() => onSelectChannel(channel)}
                      className={`
                        group relative p-2.5 md:p-4 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
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

