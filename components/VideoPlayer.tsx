
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, RefreshCw, Square, Star, Volume2, Volume1, VolumeX, 
  Maximize, Globe, Camera, Circle, Download, CheckCircle2, Activity 
} from 'lucide-react';
import { AppTheme, Channel, Country, Language } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  country: Country | null; 
  theme: AppTheme;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  lang: Language;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    channel, country, theme, isFavorite, onToggleFavorite, lang
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const t = {
    zh: { sync: '链路同步中...', fail: '无信号', retry: '重连', live: 'LIVE' },
    en: { sync: 'Syncing...', fail: 'No Signal', retry: 'Relink', live: 'LIVE' }
  }[lang];

  const initPlayer = useCallback(() => {
    if (!channel?.url || !videoRef.current) return;
    setError(false); setLoading(true);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const url = channel.url;
    if (url.includes('.m3u8') && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true, crossOrigin: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            videoRef.current?.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
        });
        hls.on(Hls.Events.ERROR, (event, data) => { if (data.fatal) setError(true); });
    } else {
        videoRef.current.src = url;
        videoRef.current.crossOrigin = "anonymous";
        videoRef.current.oncanplay = () => { setLoading(false); videoRef.current?.play(); setIsPlaying(true); };
        videoRef.current.onerror = () => setError(true);
    }
  }, [channel]);

  useEffect(() => { initPlayer(); }, [initPlayer]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const { styles } = theme;

  return (
    <div className="relative w-full group overflow-hidden touch-manipulation max-h-[60vh] md:max-h-[80vh]">
      <div className={`relative w-full aspect-video bg-black ${styles.layoutShape} overflow-hidden border ${styles.border} shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:shadow-[0_40px_100px_rgba(0,0,0,0.6)]`}>
        {/* 背景扫描线 */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        
        <video ref={videoRef} className="w-full h-full object-contain" playsInline muted={isMuted} />

        {/* 状态叠加层 */}
        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md md:backdrop-blur-xl z-30">
                <div className="relative">
                    <Activity className="w-8 h-8 md:w-12 md:h-12 text-cyan-400 animate-pulse" />
                    <RefreshCw className="w-4 h-4 md:w-6 md:h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-cyan-400 mt-4 md:mt-6 animate-pulse">{t.sync}</span>
            </div>
        )}

        {/* 响应式精简控制台 - 移动端增加默认可见度或点击触发 */}
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 md:opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 z-50">
            <div className="flex flex-col gap-2 md:gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="flex flex-col">
                            <h4 className="text-white font-black text-[10px] md:text-lg truncate max-w-[120px] md:max-w-none uppercase italic tracking-tighter">{channel?.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="flex h-1.5 w-1.5 relative shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                </span>
                                <span className="text-[7px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest">{t.live}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onToggleFavorite} className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all ${isFavorite ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        <Star className={`w-3 h-3 md:w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-8">
                        <button onClick={() => { isPlaying ? videoRef.current?.pause() : videoRef.current?.play(); setIsPlaying(!isPlaying); }} className="w-8 h-8 md:w-14 md:h-14 bg-white text-black rounded-xl md:rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                            {isPlaying ? <Square className="w-3 h-3 md:w-5 md:h-5 fill-current" /> : <Play className="w-3 h-3 md:w-5 md:h-5 fill-current ml-0.5" />}
                        </button>

                        <div className="flex items-center gap-2 md:gap-3">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white transition-colors">
                                {isMuted ? <VolumeX className="w-4 h-4 md:w-6 h-6" /> : <Volume2 className="w-4 h-4 md:w-6 h-6" />}
                            </button>
                            <input 
                                type="range" min="0" max="1" step="0.05" value={volume} 
                                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                                className="w-12 md:w-32 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-400 hidden sm:block"
                            />
                        </div>
                    </div>

                    <button onClick={() => videoRef.current?.requestFullscreen()} className="p-2 md:p-3 bg-white/10 text-white hover:bg-white/20 rounded-lg md:rounded-xl transition-all">
                        <Maximize className="w-4 h-4 md:w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
