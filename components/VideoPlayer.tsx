
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, RefreshCw, Square, Star, Volume2, VolumeX, 
  Maximize, Globe, Camera, Circle, Activity, Shuffle, StopCircle
} from 'lucide-react';
import { AppTheme, Channel, Country, Language } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  country: Country | null; 
  theme: AppTheme;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  lang: Language;
  onRandom?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    channel, country, theme, isFavorite, onToggleFavorite, lang, onRandom
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const t = {
    zh: { 
        sync: '链路同步中...', fail: '信号锁定失败', retry: '重制连接', live: 'LIVE',
        snap: '快照已保存', recStart: '录制已开始', recEnd: '录像已导出', error: '系统异常'
    },
    en: { 
        sync: 'Syncing...', fail: 'No Signal', retry: 'Relink', live: 'LIVE',
        snap: 'Snapshot Saved', recStart: 'Recording...', recEnd: 'Video Saved', error: 'System Error'
    }
  }[lang];

  const initPlayer = useCallback(() => {
    if (!channel?.url || !videoRef.current) return;
    setError(false); 
    setLoading(true);
    
    try {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const url = channel.url;
        if (url.toLowerCase().includes('.m3u8') && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 60
            });
            hlsRef.current = hls;
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setLoading(false);
                videoRef.current?.play().catch(() => setIsPlaying(false));
                setIsPlaying(true);
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    setError(true);
                    setLoading(false);
                }
            });
        } else {
            videoRef.current.crossOrigin = "anonymous";
            videoRef.current.src = url;
            videoRef.current.oncanplay = () => {
                setLoading(false);
                videoRef.current?.play().catch(() => setIsPlaying(false));
                setIsPlaying(true);
            };
            videoRef.current.onerror = () => {
                setError(true);
                setLoading(false);
            };
        }
    } catch (e) {
        console.error("Player init error:", e);
        setError(true);
        setLoading(false);
    }
  }, [channel]);

  useEffect(() => { initPlayer(); }, [initPlayer]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const takeScreenshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      try {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.download = `Looq_Snap_${channel?.name || 'TV'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast(t.snap);
      } catch (e) {
        showToast(t.error);
      }
    }
  };

  const toggleRecording = () => {
    if (!videoRef.current) return;
    
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = (videoRef.current as any).captureStream ? (videoRef.current as any).captureStream() : (videoRef.current as any).mozCaptureStream ? (videoRef.current as any).mozCaptureStream() : null;
        if (!stream) return;

        chunksRef.current = [];
        // 自动选择支持的 MIME 类型，避免崩溃
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
            ? 'video/webm;codecs=vp9' 
            : MediaRecorder.isTypeSupported('video/webm') 
                ? 'video/webm' 
                : 'video/mp4';
        
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `Looq_Rec_${channel?.name || 'TV'}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
          link.href = url;
          link.click();
          showToast(t.recEnd);
        };

        recorder.start();
        setIsRecording(true);
        showToast(t.recStart);
      } catch (e) {
        showToast(t.error);
      }
    }
  };

  const { styles } = theme;

  return (
    <div className="relative w-full group overflow-hidden touch-manipulation max-h-[55vh] md:max-h-[75vh]">
      <div className={`relative w-full aspect-video bg-black ${styles.layoutShape} overflow-hidden border ${styles.border} shadow-[0_30px_60px_rgba(0,0,0,0.8)]`}>
        {/* 背景扫描线 */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        
        <video ref={videoRef} className="w-full h-full object-contain" playsInline muted={isMuted} />

        {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-rose-500/50 z-40 animate-pulse">
                <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                <span className="text-[10px] font-black text-rose-500 tracking-widest uppercase">REC</span>
            </div>
        )}

        {toast && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest z-[60] shadow-2xl animate-in zoom-in duration-300">
                {toast}
            </div>
        )}

        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-30">
                <Activity className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 animate-spin" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 mt-4 animate-pulse">{t.sync}</span>
            </div>
        )}

        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40 p-4">
                <Globe className="w-10 h-10 text-rose-500 mb-4 opacity-20" />
                <h3 className="text-white font-black uppercase text-xs tracking-widest">{t.fail}</h3>
                <button onClick={initPlayer} className="mt-4 px-6 py-2 bg-white text-black text-[10px] font-black rounded-full hover:bg-cyan-400 transition-all uppercase tracking-widest shadow-xl">{t.retry}</button>
            </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 md:p-8 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 z-50">
            <div className="flex flex-col gap-3 md:gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col min-w-0">
                        <h4 className="text-white font-black text-[12px] md:text-xl truncate uppercase italic tracking-tighter leading-none">{channel?.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="flex h-1.5 w-1.5 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                            </span>
                            <span className="text-[7px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest">{t.live}</span>
                            <span className="text-[8px] md:text-[10px] text-white/40 uppercase font-black hidden md:block"> • {country?.name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-10">
                        <button onClick={() => { isPlaying ? videoRef.current?.pause() : videoRef.current?.play(); setIsPlaying(!isPlaying); }} className="w-10 h-10 md:w-16 md:h-16 bg-white text-black rounded-2xl md:rounded-3xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shrink-0">
                            {isPlaying ? <Square className="w-4 h-4 md:w-6 md:h-6 fill-current" /> : <Play className="w-4 h-4 md:w-6 md:h-6 fill-current ml-1" />}
                        </button>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white transition-colors">
                                {isMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
                            </button>
                            <input 
                                type="range" min="0" max="1" step="0.05" value={volume} 
                                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                                className="w-16 md:w-32 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-400 hidden sm:block"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-3">
                        <button onClick={onToggleFavorite} title="收藏" className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl transition-all ${isFavorite ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            <Star className={`w-4 h-4 md:w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={takeScreenshot} title="截图" className="p-2.5 md:p-4 bg-white/10 text-white hover:bg-white/20 rounded-xl md:rounded-2xl transition-all">
                            <Camera className="w-4 h-4 md:w-5 h-5" />
                        </button>
                        <button onClick={toggleRecording} title={isRecording ? "停止录制" : "录制"} className={`p-2.5 md:p-4 ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'} rounded-xl md:rounded-2xl transition-all`}>
                            {isRecording ? <StopCircle className="w-4 h-4 md:w-5 h-5" /> : <Circle className="w-4 h-4 md:w-5 h-5" />}
                        </button>
                        <button onClick={() => videoRef.current?.requestFullscreen()} className="p-2.5 md:p-4 bg-white/10 text-white hover:bg-white/20 rounded-xl md:rounded-2xl transition-all">
                            <Maximize className="w-4 h-4 md:w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
