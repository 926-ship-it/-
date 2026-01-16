
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, RefreshCw, Square, Star, Volume2, VolumeX, Maximize, Clock, Zap, Circle, AlertTriangle, Shuffle, WifiOff, Globe, ShieldAlert, Camera, Terminal } from 'lucide-react';
import { AppTheme, Channel, Country, Language } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  country: Country | null; 
  theme: AppTheme;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAutoSkip?: () => void;
  lang: Language;
}

const TRANSLATIONS = {
  zh: {
    uplinkFailed: '信道握手失败',
    uplinkFailedDesc: '无法锁定卫星波束，请尝试切换物理节点。',
    signalTimeout: '接收超时',
    signalTimeoutDesc: '远程载波响应缓慢，可能存在区域性干扰。',
    frequencyLost: '载波丢失',
    frequencyLostDesc: '当前坐标信号中断，正在重新搜寻频道列表。',
    forceRelink: '强制对流',
    jumpNode: '跳跃至随机节点',
    recording: '正在写入存储',
    syncing: '同步中...',
    live: '实时传输',
    searching: '扫描中...',
    global: '公海信道',
    public: '公共'
  },
  en: {
    uplinkFailed: 'Handshake Failed',
    uplinkFailedDesc: 'Unable to lock beam. Switch physical node.',
    signalTimeout: 'Reception Timeout',
    signalTimeoutDesc: 'Carrier response slow. Check interference.',
    frequencyLost: 'Carrier Lost',
    frequencyLostDesc: 'Coordinate signal lost. Rescanning catalog.',
    forceRelink: 'Sync Now',
    jumpNode: 'Quantum Jump',
    recording: 'Writing Buffer',
    syncing: 'Syncing...',
    live: 'Real-time',
    searching: 'Scanning...',
    global: 'Global Link',
    public: 'Public'
  }
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    channel, country, theme, isFavorite, onToggleFavorite, onAutoSkip, lang
}) => {
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const hlsRefs = useRef<(Hls | null)[]>([null, null]);
  
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [errorState, setErrorState] = useState<'none' | 'timeout' | 'fatal' | 'network'>('none');
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5; 
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  const t = TRANSLATIONS[lang];

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
    }, 25000);

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
    link.download = `Satellite_Capture_${channel?.name}_${Date.now()}.png`;
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
        const a = document.createElement('a'); a.href = url; a.download = `Rec_${channel?.name}.webm`; a.click();
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
      if (errorState === 'network') return { icon: <WifiOff className="w-16 h-16 text-amber-500 animate-pulse" />, title: t.uplinkFailed, desc: t.uplinkFailedDesc };
      if (errorState === 'timeout') return { icon: <Clock className="w-16 h-16 text-cyan-400 animate-spin" />, title: t.signalTimeout, desc: t.signalTimeoutDesc };
      return { icon: <AlertTriangle className="w-16 h-16 text-rose-500 animate-bounce" />, title: t.frequencyLost, desc: t.frequencyLostDesc };
  };

  const display = getErrorDisplay();

  return (
    <div className="relative w-full group animate-in zoom-in duration-1000">
      <div className={`relative w-full aspect-video bg-black ${styles.layoutShape} overflow-hidden border ${styles.border} shadow-[0_60px_150px_rgba(0,0,0,0.95)] transition-all duration-700 hover:border-white/20 animate-breathe`}>
        
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 opacity-50 z-0"></div>

        {errorState !== 'none' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-12 bg-black/90 backdrop-blur-[60px]">
                <div className="relative z-10 flex flex-col items-center space-y-10 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000">
                    <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.08)] relative group">
                        {display.icon}
                        <div className="absolute -inset-10 rounded-full border border-white/5 animate-ping opacity-10"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-black text-5xl uppercase italic tracking-tighter mb-6 leading-tight">{display.title}</h3>
                        <p className="text-white/40 text-[12px] max-w-sm mx-auto leading-relaxed font-bold uppercase tracking-[0.2em]">{display.desc}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6 pt-6">
                        <button onClick={() => window.location.reload()} className="px-14 py-5 bg-white text-black text-[12px] font-black uppercase rounded-full hover:bg-cyan-400 transition-all active:scale-95 flex items-center gap-4 shadow-2xl">
                            <RefreshCw className="w-5 h-5" /> {t.forceRelink}
                        </button>
                        <button onClick={onAutoSkip} className="px-14 py-5 bg-white/10 text-white text-[12px] font-black uppercase rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-95 flex items-center gap-4">
                            <Shuffle className="w-5 h-5" /> {t.jumpNode}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {[0, 1].map((index) => (
            <video
                key={index} ref={videoRefs[index]} playsInline muted={isMuted}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 z-10 ${activePlayerIndex === index && errorState === 'none' ? 'opacity-100' : 'opacity-0'}`}
            />
        ))}

        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20"></div>

        {isRecording && (
          <div className="absolute top-10 left-10 z-40 flex items-center gap-5 bg-black/70 backdrop-blur-3xl px-6 py-3 rounded-full border border-red-500/50 shadow-2xl animate-in slide-in-from-left duration-500">
             <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse shadow-[0_0_20px_#dc2626] ripple-dot relative"></div>
             <span className="text-white text-[12px] font-black tracking-widest uppercase italic">{t.recording}</span>
             <span className="text-red-400 font-mono text-sm font-black border-l border-white/20 pl-5">
                 {Math.floor(recordingDuration/60).toString().padStart(2,'0')}:{(recordingDuration%60).toString().padStart(2,'0')}
             </span>
          </div>
        )}

        {loading && errorState === 'none' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-3xl z-30 space-y-8 animate-in fade-in duration-500">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-[8px] border-cyan-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-[8px] border-t-cyan-400 rounded-full animate-spin"></div>
                    <Terminal className="absolute inset-0 m-auto w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <div className="text-[12px] text-cyan-400 font-mono font-black uppercase tracking-[0.6em] animate-pulse">{t.syncing}</div>
             </div>
        )}

        {/* Console UI - 更加现代化的悬浮玻璃面板 */}
        <div className={`absolute inset-x-10 bottom-10 p-8 bg-black/40 backdrop-blur-[60px] rounded-[2.5rem] border border-white/10 transition-all duration-700 shadow-3xl z-40 ${errorState !== 'none' ? 'opacity-0 translate-y-12' : 'opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8 min-w-0">
                    <button onClick={() => {
                        const v = videoRefs[activePlayerIndex].current;
                        if (isPlaying) v?.pause(); else v?.play();
                        setIsPlaying(!isPlaying);
                    }} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-110 hover:bg-cyan-400 active:scale-90 shadow-[0_20px_50px_rgba(255,255,255,0.25)] group/btn">
                        {isPlaying ? <Square className="w-8 h-8 fill-current group-hover/btn:scale-110 transition-transform" /> : <Play className="w-8 h-8 fill-current ml-2 group-hover/btn:scale-110 transition-transform" />}
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                            <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-500 text-[10px] font-black text-white rounded-md shadow-xl uppercase tracking-widest animate-pulse">{t.live}</span>
                            <h4 className="text-white font-black text-2xl tracking-tighter truncate max-w-xl uppercase italic leading-none">
                                {channel?.name || t.searching}
                            </h4>
                        </div>
                        <div className="flex items-center gap-4 text-white/30 text-[11px] font-black uppercase tracking-[0.2em] mt-3">
                            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> {channel?.group || t.public}</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                            <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> {country?.name || t.global}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={onToggleFavorite} 
                        className={`p-5 rounded-[22px] transition-all active:scale-90 shadow-2xl ${isFavorite ? 'bg-amber-400 text-black shadow-amber-500/40 scale-110' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                        title="收藏"
                    >
                        <Star className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button onClick={takeScreenshot} title="卫星截屏" className="p-5 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-[22px] transition-all active:scale-90 shadow-2xl">
                        <Camera className="w-6 h-6" />
                    </button>
                    
                    <button onClick={isRecording ? stopRecording : startRecording} title="实时录制" className={`p-5 rounded-[22px] transition-all shadow-2xl ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                        <Circle className={`w-6 h-6 ${isRecording ? 'fill-current' : ''}`} />
                    </button>

                    <div className="h-12 w-[1px] bg-white/10 mx-3"></div>

                    <div className="flex items-center group/vol">
                      <button onClick={() => setIsMuted(!isMuted)} className="p-5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-[22px] text-white transition-all shadow-2xl">
                          {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 text-rose-500" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                      <div className="w-0 overflow-hidden group-hover/vol:w-40 group-hover/vol:ml-6 transition-all duration-700 ease-out flex items-center">
                          <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (v > 0) setIsMuted(false); }} className="w-36 h-2 accent-cyan-400 bg-white/10 rounded-full appearance-none cursor-pointer" />
                      </div>
                    </div>

                    <button onClick={() => videoRefs[activePlayerIndex].current?.requestFullscreen()} title="全屏视界" className="p-5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-[22px] text-white transition-all shadow-2xl">
                        <Maximize className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
