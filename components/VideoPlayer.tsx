
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, RefreshCw, Square, Star, Volume2, VolumeX, Maximize, Clock, Zap, Circle, AlertTriangle, Shuffle, WifiOff, Globe, ShieldAlert, Camera, Terminal } from 'lucide-react';
import { AppTheme, Channel, Country } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  country: Country | null; 
  theme: AppTheme;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAutoSkip?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    channel, country, theme, isFavorite, onToggleFavorite, onAutoSkip
}) => {
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const hlsRefs = useRef<(Hls | null)[]>([null, null]);
  
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [errorState, setErrorState] = useState<'none' | 'timeout' | 'fatal' | 'network'>('none');
  const [errorDetail, setErrorDetail] = useState<string>('');
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5; 
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  const killAllPlayers = useCallback(() => {
    videoRefs.forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.removeAttribute('src');
        ref.current.load();
      }
    });
    hlsRefs.current.forEach((hls, idx) => {
      if (hls) {
        hls.destroy();
        hlsRefs.current[idx] = null;
      }
    });
  }, []);

  const resetState = () => {
    setErrorState('none');
    setErrorDetail('');
    setLoading(true);
    retryCountRef.current = 0;
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
  };

  useEffect(() => {
    videoRefs.forEach(ref => {
      if (ref.current) ref.current.volume = volume;
    });
  }, [volume]);

  useEffect(() => {
    const url = channel?.url;
    if (!url) return;
    if (isRecording) stopRecording();
    killAllPlayers();
    resetState();

    const nextIndex = (activePlayerIndex + 1) % 2;
    const nextVideo = videoRefs[nextIndex].current;
    if (!nextVideo) return;

    loadTimeoutRef.current = window.setTimeout(() => {
        if (loading || !isPlaying) {
            setErrorState('timeout');
            setLoading(false);
        }
    }, 20000);

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        enableWorker: true,
        xhrSetup: (xhr) => { xhr.withCredentials = false; }
      });
      hlsRefs.current[nextIndex] = hls;
      hls.loadSource(url);
      hls.attachMedia(nextVideo);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        videoRefs.forEach((ref, idx) => { if (idx !== nextIndex && ref.current) ref.current.pause(); });
        nextVideo.play().catch(() => { setIsPlaying(false); });
        setLoading(false);
        setIsPlaying(true);
        setErrorState('none');
        setActivePlayerIndex(nextIndex);
        retryCountRef.current = 0;
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
            if (retryCountRef.current < MAX_RETRIES) {
                retryCountRef.current++;
                setTimeout(() => {
                  if (!hlsRefs.current[nextIndex]) return;
                  if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                  else hls.recoverMediaError();
                }, Math.pow(2, retryCountRef.current) * 500);
            } else {
                setErrorState(data.type === Hls.ErrorTypes.NETWORK_ERROR ? 'network' : 'fatal');
                setErrorDetail(data.details || '');
                setLoading(false);
                if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
            }
        }
      });
    } else {
      nextVideo.src = url;
      nextVideo.oncanplay = () => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        nextVideo.play().catch(() => { setIsPlaying(false); });
        setLoading(false);
        setIsPlaying(true);
        setErrorState('none');
        setActivePlayerIndex(nextIndex);
      };
      nextVideo.onerror = () => { setErrorState('network'); setLoading(false); };
    }
    return () => { if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current); };
  }, [channel?.url]);

  useEffect(() => { return () => killAllPlayers(); }, [killAllPlayers]);

  const takeScreenshot = () => {
    const video = videoRefs[activePlayerIndex].current;
    if (!video || errorState !== 'none' || loading) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Live_Snap_${channel?.name}_${Date.now()}.png`;
    link.click();
  };

  const startRecording = () => {
    const video = videoRefs[activePlayerIndex].current;
    if (!video) return;
    const stream = (video as any).captureStream ? (video as any).captureStream() : null;
    if (!stream) return;
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunksRef.current, { type: 'video/webm' }));
        const a = document.createElement('a'); a.href = url; a.download = `Record_${channel?.name}.webm`; a.click();
    };
    recorder.start();
    setIsRecording(true);
    setRecordingDuration(0);
    recordingTimerRef.current = window.setInterval(() => setRecordingDuration(p => p + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const { styles } = theme;
  const getErrorDisplay = () => {
      if (errorState === 'network') return { icon: <WifiOff className="w-12 h-12 text-amber-500" />, title: 'Uplink Failed', desc: 'Could not establish connection to the host server.' };
      if (errorState === 'timeout') return { icon: <Clock className="w-12 h-12 text-cyan-500 animate-pulse" />, title: 'Signal Timeout', desc: 'Station is taking too long to respond. Network congestion.' };
      return { icon: <AlertTriangle className="w-12 h-12 text-rose-500" />, title: 'Frequency Lost', desc: 'The carrier wave for this node has been disconnected.' };
  };

  const display = getErrorDisplay();

  return (
    <div className="relative w-full group">
      <div className={`relative w-full aspect-video bg-black ${styles.layoutShape} overflow-hidden border ${styles.border} shadow-[0_40px_120px_rgba(0,0,0,0.9)]`}>
        
        {/* Ambient Glow behind video */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 opacity-50"></div>

        {errorState !== 'none' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-12 bg-black/95 backdrop-blur-[40px]">
                <div className="relative z-10 flex flex-col items-center space-y-8 animate-in fade-in zoom-in slide-in-from-bottom-8 duration-1000">
                    <div className="w-28 h-28 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05)] relative group">
                        {display.icon}
                        <div className="absolute -inset-6 rounded-full border border-white/5 animate-ping opacity-10"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-black text-4xl uppercase italic tracking-tighter mb-4">{display.title}</h3>
                        <p className="text-white/40 text-[11px] max-w-xs mx-auto leading-relaxed font-bold uppercase tracking-widest">{display.desc}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button onClick={() => window.location.reload()} className="px-12 py-4 bg-white text-black text-[11px] font-black uppercase rounded-full hover:bg-cyan-400 transition-all active:scale-90 flex items-center gap-3">
                            <RefreshCw className="w-4 h-4" /> Force Relink
                        </button>
                        <button onClick={onAutoSkip} className="px-12 py-4 bg-white/5 text-white text-[11px] font-black uppercase rounded-full border border-white/10 hover:bg-white/10 transition-all active:scale-90 flex items-center gap-3">
                            <Shuffle className="w-4 h-4" /> Jump Node
                        </button>
                    </div>
                </div>
            </div>
        )}

        {[0, 1].map((index) => (
            <video
                key={index} ref={videoRefs[index]} playsInline muted={isMuted}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${activePlayerIndex === index && errorState === 'none' ? 'opacity-100' : 'opacity-0'}`}
            />
        ))}

        {/* Scanline Effect overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

        {isRecording && (
          <div className="absolute top-8 left-8 z-40 flex items-center gap-4 bg-black/60 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-red-500/40 shadow-2xl">
             <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_#dc2626]"></div>
             <span className="text-white text-[11px] font-black tracking-widest uppercase italic">Recording</span>
             <span className="text-red-400 font-mono text-xs font-black border-l border-white/10 pl-4">
                 {Math.floor(recordingDuration/60).toString().padStart(2,'0')}:{(recordingDuration%60).toString().padStart(2,'0')}
             </span>
          </div>
        )}

        {loading && errorState === 'none' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl z-20 space-y-6">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-[6px] border-cyan-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-[6px] border-t-cyan-500 rounded-full animate-spin"></div>
                    <Terminal className="absolute inset-0 m-auto w-6 h-6 text-cyan-500 animate-pulse" />
                </div>
                <div className="text-[11px] text-cyan-500 font-mono font-black uppercase tracking-[0.5em] animate-pulse">Syncing Stream...</div>
             </div>
        )}

        {/* Console UI */}
        <div className={`absolute inset-x-8 bottom-8 p-6 bg-black/60 backdrop-blur-[50px] rounded-[32px] border border-white/10 transition-all duration-700 shadow-2xl ${errorState !== 'none' ? 'opacity-0 translate-y-8' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 min-w-0">
                    <button onClick={() => {
                        const v = videoRefs[activePlayerIndex].current;
                        if (isPlaying) v?.pause(); else v?.play();
                        setIsPlaying(!isPlaying);
                    }} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-110 hover:bg-cyan-400 active:scale-95 shadow-[0_15px_40px_rgba(255,255,255,0.2)]">
                        {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-rose-500 text-[9px] font-black text-white rounded shadow-lg uppercase tracking-widest animate-pulse">Live</span>
                            <h4 className="text-white font-black text-xl tracking-tighter truncate max-w-md uppercase italic leading-none">
                                {channel?.name || 'Searching...'}
                            </h4>
                        </div>
                        <div className="flex items-center gap-3 text-white/30 text-[10px] font-black uppercase tracking-widest mt-2">
                            <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-cyan-400" /> {channel?.group || 'Public'}</div>
                            <div className="w-1 h-1 rounded-full bg-white/20"></div>
                            <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {country?.name || 'Global'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={onToggleFavorite} 
                        className={`p-4 rounded-[20px] transition-all active:scale-90 shadow-xl ${isFavorite ? 'bg-amber-400 text-black shadow-amber-500/30' : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}
                        title="Favorite"
                    >
                        <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button onClick={takeScreenshot} className="p-4 bg-white/5 text-white hover:bg-white/10 border border-white/5 rounded-[20px] transition-all active:scale-90 shadow-xl">
                        <Camera className="w-5 h-5" />
                    </button>
                    
                    <button onClick={isRecording ? stopRecording : startRecording} className={`p-4 rounded-[20px] transition-all shadow-xl ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}>
                        <Circle className={`w-5 h-5 ${isRecording ? 'fill-current' : ''}`} />
                    </button>

                    <div className="h-10 w-[1px] bg-white/10 mx-2"></div>

                    <div className="flex items-center group/vol">
                      <button onClick={() => setIsMuted(!isMuted)} className="p-4 bg-white/5 border border-white/5 hover:bg-white/10 rounded-[20px] text-white transition-all shadow-xl">
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <div className="w-0 overflow-hidden group-hover/vol:w-32 group-hover/vol:ml-4 transition-all duration-500 flex items-center">
                          <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (v > 0) setIsMuted(false); }} className="w-28 h-1.5 accent-cyan-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
                      </div>
                    </div>

                    <button onClick={() => videoRefs[activePlayerIndex].current?.requestFullscreen()} className="p-4 bg-white/5 border border-white/5 hover:bg-white/10 rounded-[20px] text-white transition-all shadow-xl">
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
