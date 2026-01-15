
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, RefreshCw, Square, Star, Volume2, VolumeX, Maximize, Clock, Zap, Circle, AlertTriangle, Shuffle, WifiOff, Globe, ShieldAlert, Camera } from 'lucide-react';
import { AppTheme, Channel, Country } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  country: Country | null; 
  theme: AppTheme;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAutoSkip?: () => void; // 自动跳台回调
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

  // 核心清理函数：停止所有视频和流
  const killAllPlayers = useCallback(() => {
    videoRefs.forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.removeAttribute('src');
        ref.current.load(); // 强制清除缓存
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
      if (ref.current) {
        ref.current.volume = volume;
      }
    });
  }, [volume]);

  useEffect(() => {
    const url = channel?.url;
    if (!url) return;

    if (isRecording) stopRecording();
    
    // 1. 立即停止当前所有声音和播放
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
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        }
      });
      hlsRefs.current[nextIndex] = hls;
      
      hls.loadSource(url);
      hls.attachMedia(nextVideo);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        
        // 确保其他播放器完全静音并停止
        videoRefs.forEach((ref, idx) => {
          if (idx !== nextIndex && ref.current) {
            ref.current.pause();
          }
        });

        nextVideo.play().catch(() => {
            setIsPlaying(false);
        });
        
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
                const backoff = Math.pow(2, retryCountRef.current) * 500;
                setTimeout(() => {
                  if (!hlsRefs.current[nextIndex]) return;
                  if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                  else hls.recoverMediaError();
                }, backoff);
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
      nextVideo.onerror = () => {
        setErrorState('network');
        setErrorDetail('Native video source failure');
        setLoading(false);
      };
    }

    return () => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        // 如果频道切换太快，确保在下一次 effect 前清理
    };
  }, [channel?.url]);

  // 组件卸载时销毁一切
  useEffect(() => {
    return () => killAllPlayers();
  }, [killAllPlayers]);

  const takeScreenshot = () => {
    const video = videoRefs[activePlayerIndex].current;
    if (!video || errorState !== 'none' || loading) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Live_Snap_${channel?.name || 'Unknown'}_${new Date().getTime()}.png`;
      link.click();
    } catch (err) { console.error('截图失败:', err); }
  };

  const startRecording = () => {
    const video = videoRefs[activePlayerIndex].current;
    if (!video || errorState !== 'none') return;
    try {
      const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
      if (!stream) return;
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Live_Record_${channel?.name}_${new Date().getTime()}.webm`;
        a.click();
      };
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = window.setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch (err) {}
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const { styles } = theme;
  const getErrorDisplay = () => {
      if (errorDetail === 'manifestLoadError') {
          return {
              icon: <ShieldAlert className="w-12 h-12 text-rose-500" />,
              title: 'CORS 或 资源下线',
              desc: '直播服务器拒绝了连接请求。这通常是因为源地址已关闭或跨域限制。'
          };
      }
      if (errorState === 'network') {
          return {
              icon: <WifiOff className="w-12 h-12 text-amber-500" />,
              title: '主干节点响应失败',
              desc: '无法建立与目标服务器的有效握手。请检查本地网络连接。'
          };
      }
      if (errorState === 'timeout') {
          return {
              icon: <Clock className="w-12 h-12 text-cyan-500 animate-pulse" />,
              title: '信号握手超时',
              desc: '服务器响应时间过长。该信道目前可能发生拥堵。'
          };
      }
      return {
          icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
          title: '频率信号丢失',
          desc: '该频率当前无法接收到有效载波。'
      };
  };

  const display = getErrorDisplay();

  return (
    <div className="relative w-full group select-none">
      <div className="absolute inset-0 -m-8 bg-cyan-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

      <div className={`relative w-full aspect-video bg-[#0a0a0a] rounded-3xl overflow-hidden border ${styles.border} shadow-[0_30px_100px_rgba(0,0,0,0.8)]`}>
        
        {errorState !== 'none' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-10 bg-black/90 backdrop-blur-2xl">
                <div className="relative z-10 flex flex-col items-center space-y-6 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-700">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_60px_rgba(244,63,94,0.1)] group/icon relative">
                        {display.icon}
                        <div className="absolute -inset-4 rounded-full border border-white/5 animate-pulse opacity-20"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-black text-3xl uppercase italic tracking-tighter">{display.title}</h3>
                        <p className="text-gray-400 text-xs mt-4 max-w-sm mx-auto leading-relaxed font-bold opacity-80">{display.desc}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white text-black text-[11px] font-black uppercase rounded-full hover:bg-cyan-400 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5" /> 强制重连信道
                        </button>
                        <button onClick={onAutoSkip} className="px-10 py-4 bg-white/5 text-white text-[11px] font-black uppercase rounded-full border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95">
                            <Shuffle className="w-3.5 h-3.5" /> 尝试其他频率
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

        {isRecording && errorState === 'none' && (
          <div className="absolute top-6 left-6 z-40 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-red-500/30">
             <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,1)]"></div>
             <span className="text-white text-[10px] font-black tracking-widest uppercase">REC</span>
             <span className="text-red-400 font-mono text-xs font-bold border-l border-white/10 pl-3">
                 {Math.floor(recordingDuration/60).toString().padStart(2,'0')}:{(recordingDuration%60).toString().padStart(2,'0')}
             </span>
          </div>
        )}

        {loading && errorState === 'none' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-20 space-y-4">
                <div className="relative w-16 h-16 animate-pulse">
                    <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
                <div className="text-[10px] text-cyan-500 font-mono font-black uppercase tracking-[0.3em]">同步信号中...</div>
             </div>
        )}

        <div className={`absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent transition-all duration-700 ${errorState !== 'none' ? 'opacity-20 pointer-events-none translate-y-4' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <button onClick={() => {
                        const v = videoRefs[activePlayerIndex].current;
                        if (isPlaying) v?.pause(); else v?.play();
                        setIsPlaying(!isPlaying);
                    }} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl">
                        {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-cyan-500 text-[9px] font-black text-black rounded-sm uppercase tracking-tighter">LIVE</span>
                            <h4 className="text-white font-black text-lg tracking-tight truncate max-w-[150px] md:max-w-md uppercase italic">
                                {channel?.name || '等待选台中...'}
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            <Zap className="w-3 h-3 text-cyan-400 fill-current" /> 
                            {channel?.group || '全球通用信道'} • {country?.name || '未知地域'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={takeScreenshot} className={`p-3.5 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all active:scale-90`} title="拍摄快照">
                        <Camera className="w-5 h-5" />
                    </button>
                    <button onClick={isRecording ? stopRecording : startRecording} className={`p-3.5 rounded-xl transition-all ${isRecording ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-white/10 text-white hover:bg-white/20'}`} title={isRecording ? "停止录制" : "开始录制"}>
                        <Circle className={`w-5 h-5 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
                    </button>
                    <div className="flex items-center group/vol">
                      <button onClick={() => setIsMuted(!isMuted)} className="p-3.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <div className="w-0 overflow-hidden group-hover/vol:w-28 group-hover/vol:ml-3 transition-all duration-500 flex items-center">
                          <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (v > 0) setIsMuted(false); }} className="w-24 h-1.5 accent-cyan-500 bg-white/20 rounded-full appearance-none cursor-pointer" />
                      </div>
                    </div>
                    <button onClick={() => videoRefs[activePlayerIndex].current?.requestFullscreen()} className="p-3.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
