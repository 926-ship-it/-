
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, RefreshCw, Square, Star, Volume2, Volume1, VolumeX, 
  Maximize, Globe, Camera, Circle, Download, CheckCircle2 
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const t = {
    zh: { 
        sync: '同步中...', fail: '信号锁定失败', retry: '强制重连', live: 'LIVE',
        shotSuccess: '截图已保存', recStart: '录制中', recStop: '已保存',
        corsWarning: 'CORS 受限'
    },
    en: { 
        sync: 'Syncing...', fail: 'Lock Failed', retry: 'Relink', live: 'LIVE',
        shotSuccess: 'Saved', recStart: 'REC', recStop: 'Done',
        corsWarning: 'CORS Protected'
    }
  }[lang];

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const initPlayer = useCallback(() => {
    if (!channel?.url || !videoRef.current) return;
    
    setError(false);
    setLoading(true);
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

  const takeScreenshot = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.download = `Looq-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        triggerToast(t.shotSuccess);
    } catch (e) { triggerToast(t.corsWarning); }
  };

  const toggleRecording = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    } else {
        try {
            const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
            if (!stream) throw new Error();
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `Looq-REC-${Date.now()}.webm`;
                link.href = url;
                link.click();
                triggerToast(t.recStop);
            };
            recorder.start();
            setIsRecording(true);
            triggerToast(t.recStart);
        } catch (e) { triggerToast(t.corsWarning); }
    }
  };

  const { styles } = theme;

  return (
    <div className="relative w-full group overflow-hidden touch-manipulation">
      <div className={`relative w-full aspect-video bg-black ${styles.layoutShape} overflow-hidden border ${styles.border} shadow-2xl`}>
        <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
        
        {isRecording && <div className="absolute top-4 right-4 z-50 flex items-center gap-1.5 bg-rose-500/20 backdrop-blur-md px-2 py-1 rounded-full border border-rose-500/50">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">REC</span>
        </div>}

        <video ref={videoRef} className="w-full h-full object-contain" playsInline muted={isMuted} />

        {showToast && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex items-center gap-2 bg-black/80 backdrop-blur-2xl px-4 py-2.5 rounded-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-bold text-white uppercase">{showToast}</span>
            </div>
        )}

        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-30">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 mt-3">{t.sync}</span>
            </div>
        )}

        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40 p-4">
                <h3 className="text-white font-black uppercase text-xs">{t.fail}</h3>
                <button onClick={initPlayer} className="mt-4 px-5 py-2 bg-white text-black text-[9px] font-bold rounded-full hover:bg-cyan-400 transition-all uppercase">{t.retry}</button>
            </div>
        )}

        {/* 响应式控制台 */}
        <div className={`absolute inset-x-2 md:inset-x-6 bottom-2 md:bottom-6 p-3 md:p-5 bg-black/40 backdrop-blur-3xl rounded-2xl md:rounded-3xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 z-50 shadow-2xl`}>
            <div className="flex flex-col gap-2 md:gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-white font-bold text-[11px] md:text-sm truncate max-w-[120px] md:max-w-[200px] italic">{channel?.name}</h4>
                        <div className="flex items-center gap-1.5 text-[8px] text-white/40 uppercase font-black shrink-0">
                            <span className="text-rose-500 animate-pulse">{t.live}</span>
                            <span>•</span>
                            <span>{country?.code}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button onClick={takeScreenshot} className="p-1.5 md:p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <Camera className="w-3.5 h-3.5 md:w-4 h-4" />
                        </button>
                        <button onClick={toggleRecording} className={`p-1.5 md:p-2 rounded-lg transition-all ${isRecording ? 'text-rose-500 bg-rose-500/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                            <Circle className={`w-3.5 h-3.5 md:w-4 h-4 ${isRecording ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-6">
                        <button onClick={() => { isPlaying ? videoRef.current?.pause() : videoRef.current?.play(); setIsPlaying(!isPlaying); }} className="w-8 h-8 md:w-10 md:h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                            {isPlaying ? <Square className="w-3 h-3 md:w-4 h-4 fill-current" /> : <Play className="w-3 h-3 md:w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-cyan-400 transition-colors">
                                {isMuted ? <VolumeX className="w-4 h-4 md:w-5 h-5" /> : <Volume2 className="w-4 h-4 md:w-5 h-5" />}
                            </button>
                            <input 
                                type="range" min="0" max="1" step="0.05" value={volume} 
                                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                                className="w-16 md:w-24 h-0.5 md:h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2">
                        <button onClick={onToggleFavorite} className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all ${isFavorite ? 'bg-amber-400 text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                            <Star className={`w-3.5 h-3.5 md:w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={() => videoRef.current?.requestFullscreen()} className="p-2 md:p-2.5 bg-white/5 text-white hover:bg-white/10 rounded-lg md:rounded-xl">
                            <Maximize className="w-3.5 h-3.5 md:w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
