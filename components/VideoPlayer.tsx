import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { AlertCircle, Play, RefreshCw, Radio, Music, Square, Star, Captions, StopCircle, Volume2, VolumeX, Maximize, AlarmClock, Check, Clock } from 'lucide-react';
import { AppTheme, Channel, Country } from '../types';
import { getTimezone } from '../services/iptvService';

interface VideoPlayerProps {
  channel: Channel | null;
  country: Country | null; 
  autoPlay?: boolean;
  isRadio?: boolean;
  theme: AppTheme;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddReminder: (channel: Channel, time: string) => void;
  settings?: { enableSound: boolean };
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    channel, 
    country,
    autoPlay = true, 
    isRadio = false, 
    theme,
    isFavorite,
    onToggleFavorite,
    onAddReminder,
    settings = { enableSound: true }
}) => {
  const { styles } = theme;
  
  // Dual Video Engine State
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const hlsRefs = useRef<(Hls | null)[]>([null, null]);

  // General State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Volume State
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Features State
  const [signalStrength, setSignalStrength] = useState<number>(0); 
  const [showTranslate, setShowTranslate] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  
  // Alarm State
  const [showAlarmPicker, setShowAlarmPicker] = useState(false);
  const [alarmTime, setAlarmTime] = useState('');

  // Audio Context for Tick Sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Helper: Play Tick Sound
  const playTick = useCallback(() => {
      if (!settings.enableSound) return;
      try {
          if (!audioCtxRef.current) {
              audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') ctx.resume();
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
          osc.type = 'sine';
          
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.06);
      } catch (e) {
          // Ignore audio errors
      }
  }, [settings.enableSound]);

  // Update Clock based on country
  useEffect(() => {
    if (!country && !channel) return;
    const tz = country ? getTimezone(country.code) : 'UTC';

    const updateTime = () => {
        try {
            const now = new Date();
            const timeString = new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: tz
            }).format(now);
            setCurrentTimeStr(timeString);
        } catch (e) {
            setCurrentTimeStr(new Date().toLocaleTimeString('en-GB'));
        }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [country, channel]);

  // Volume Sync
  useEffect(() => {
      videoRefs.forEach(ref => {
          if (ref.current) {
              ref.current.volume = volume;
              ref.current.muted = isMuted;
          }
      });
  }, [volume, isMuted]);

  // --- DUAL ENGINE LOADING LOGIC ---
  useEffect(() => {
    const url = channel?.url;
    
    if (!url) {
        setLoading(false); 
        setSignalStrength(0);
        setIsPlaying(false);
        return;
    }

    const nextIndex = (activePlayerIndex + 1) % 2;
    const nextVideo = videoRefs[nextIndex].current;
    const currentVideo = videoRefs[activePlayerIndex].current;

    if (!nextVideo) return;

    if (isRecording) handleStopRecording();

    setSignalStrength(1); 
    setShowTranslate(false);
    setError(null);
    if (!currentVideo || currentVideo.paused || currentVideo.ended) {
        setLoading(true);
    }
    
    setShowAlarmPicker(false);

    if (hlsRefs.current[nextIndex]) {
        hlsRefs.current[nextIndex]?.destroy();
        hlsRefs.current[nextIndex] = null;
    }

    const isHlsSource = url.includes('.m3u8');
    let hls: Hls | null = null;

    const onReadyToSwitch = () => {
        playTick(); 
        setActivePlayerIndex(nextIndex);
        setIsPlaying(true);
        setLoading(false);
        setSignalStrength(4);

        if (autoPlay) {
            nextVideo.play().catch(e => console.log("Autoplay prevented", e));
        }

        setTimeout(() => {
            if (currentVideo) {
                currentVideo.pause();
                currentVideo.removeAttribute('src');
                currentVideo.load(); 
            }
            if (hlsRefs.current[activePlayerIndex]) {
                hlsRefs.current[activePlayerIndex]?.destroy();
                hlsRefs.current[activePlayerIndex] = null;
            }
        }, 500); 
    };

    const onError = (e: any) => {
        // Improve error logging
        const msg = e instanceof Event ? (e.type === 'error' ? 'Network/Format Error' : e.type) : e;
        console.warn("Stream Error:", msg);
        
        if (activePlayerIndex !== nextIndex) {
             setActivePlayerIndex(nextIndex);
        }
        setError(isRadio ? "电台无法连接" : "直播流无法播放");
        setLoading(false);
        setSignalStrength(0);
    };

    const cleanupListeners = () => {
        nextVideo.removeEventListener('error', onError);
        nextVideo.removeEventListener('canplay', onReadyToSwitch);
    };

    nextVideo.addEventListener('error', onError);
    nextVideo.addEventListener('canplay', onReadyToSwitch);

    if (isHlsSource && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRefs.current[nextIndex] = hls;

      hls.loadSource(url);
      hls.attachMedia(nextVideo);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
         if (autoPlay) nextVideo.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              onError(data);
              hls?.destroy();
              break;
          }
        }
      });
    } else {
      nextVideo.src = url;
      nextVideo.load();
    }

    return () => {
        cleanupListeners();
    };

  }, [channel?.url, channel?.id]);

  const togglePlay = () => {
    const video = videoRefs[activePlayerIndex].current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleStartRecording = () => {
    const video = videoRefs[activePlayerIndex].current;
    if (!video) return;

    try {
        const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;

        if (!stream) {
            alert("您的浏览器不支持直接录制此媒体流。");
            return;
        }

        const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
            ? 'video/webm; codecs=vp9' 
            : 'video/webm';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${channel?.name || 'recording'}-${timestamp}.webm`;
            
            setIsRecording(false);

            // @ts-ignore
            if (window.showSaveFilePicker) {
                try {
                    // @ts-ignore
                    const handle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'WebM Video',
                            accept: { 'video/webm': ['.webm'] },
                        }],
                    });
                    // @ts-ignore
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return;
                } catch (err) {
                    if ((err as Error).name === 'AbortError') return;
                    console.warn("Save picker failed, fallback to download");
                }
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (e) {
        console.error("Recording failed:", e);
        alert("无法录制。可能是由于版权保护(CORS)或浏览器限制。");
    }
  };

  const handleStopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
  };

  const handleSaveReminder = () => {
      if (!alarmTime || !channel) return;
      onAddReminder(channel, alarmTime);
      setShowAlarmPicker(false);
      setAlarmTime('');
  };

  if (!channel) {
    return (
      <div className={`w-full aspect-video flex flex-col items-center justify-center ${styles.card} ${styles.layoutShape} border-dashed opacity-70`}>
        {isRadio ? <Radio className={`w-16 h-16 mb-4 ${styles.textDim}`} /> : <TvIcon className={`w-16 h-16 mb-4 ${styles.textDim}`} />}
        <p className={styles.textDim}>请从列表中选择一个{isRadio ? '电台' : '频道'}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className={`
        relative w-full aspect-video ${styles.layoutShape} overflow-hidden shadow-2xl group 
        ${styles.border} ${theme.type === 'web95' ? 'bg-black' : styles.bgSidebar}
      `}>
        
        {theme.type === 'web95' && (
             <div className="absolute top-0 left-0 right-0 h-8 bg-[#000080] flex items-center justify-between px-2 z-20 select-none">
                 <span className="text-white font-bold text-xs">Media Player - {channel.name}</span>
                 <div className="flex gap-1">
                     <div className="bg-[#c0c0c0] w-4 h-4 text-[10px] text-black border border-white border-b-black border-r-black flex items-center justify-center">_</div>
                     <div className="bg-[#c0c0c0] w-4 h-4 text-[10px] text-black border border-white border-b-black border-r-black flex items-center justify-center">□</div>
                     <div className="bg-[#c0c0c0] w-4 h-4 text-[10px] text-black border border-white border-b-black border-r-black flex items-center justify-center">×</div>
                 </div>
             </div>
        )}

        {/* DUAL VIDEO PLAYERS - Removed crossOrigin to fix stream errors */}
        {[0, 1].map((index) => (
            <video
                key={index}
                ref={videoRefs[index]}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${isRadio ? 'opacity-0' : ''}`}
                style={{ 
                    opacity: activePlayerIndex === index && !isRadio ? 1 : 0,
                    paddingTop: theme.type === 'web95' ? '32px' : '0',
                    zIndex: activePlayerIndex === index ? 1 : 0
                }}
                playsInline
            />
        ))}

        {isRadio && (
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${styles.bgSidebar} z-10`}>
                <div className="relative">
                    {isPlaying && (
                        <div className={`absolute inset-0 ${styles.buttonPrimary} blur-3xl opacity-20 animate-pulse rounded-full`}></div>
                    )}
                    <div className={`relative z-10 w-32 h-32 rounded-full ${styles.card} flex items-center justify-center`}>
                        {channel.logo ? (
                            <img src={channel.logo} alt={channel.name} className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                            <Music className={`w-12 h-12 ${styles.textMain}`} />
                        )}
                    </div>
                </div>
            </div>
        )}

        {loading && (
             <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm`}>
                <div className="flex items-center gap-2">
                    <RefreshCw className={`w-8 h-8 ${styles.textMain} animate-spin`} />
                    <span className={styles.textMain}>Connecting...</span>
                </div>
             </div>
        )}

        {showTranslate && (
            <div className="absolute bottom-20 left-0 right-0 px-8 text-center z-20 pointer-events-none">
                <div className={`bg-black/70 text-white px-4 py-2 rounded-lg inline-block backdrop-blur-sm`}>
                    <p className="text-lg font-medium leading-relaxed">
                        [实时翻译功能已开启] <br/>
                        <span className="text-sm text-slate-400 italic">正在监听音频流...</span>
                    </p>
                </div>
            </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-white font-medium">{error}</p>
            <button 
              onClick={() => {
                  setLoading(true);
                  setError(null);
                  const currentHls = hlsRefs.current[activePlayerIndex];
                  const currentVid = videoRefs[activePlayerIndex].current;
                  if(currentHls) currentHls.startLoad();
                  else if(currentVid) currentVid.load();
              }}
              className={`mt-4 px-4 py-2 ${styles.layoutShape} ${styles.buttonPrimary} flex items-center gap-2`}
            >
              <RefreshCw className="w-4 h-4" /> 重试
            </button>
          </div>
        )}

        <div className={`
             absolute inset-0 z-20 flex flex-col justify-between p-4 transition-opacity duration-300
             ${theme.type === 'web95' ? 'opacity-100 pointer-events-none' : 'opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/80 via-transparent to-black/40'}
        `}>
            <div className={`flex justify-between items-start pointer-events-auto ${theme.type === 'web95' ? 'mt-8' : ''}`}>
                 <div className="bg-red-600 px-2 py-1 rounded text-xs font-bold text-white border border-white/10 animate-pulse">
                    LIVE
                 </div>
                 
                 {isRecording && (
                    <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1 rounded-full animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-xs font-bold text-red-400">REC</span>
                    </div>
                 )}
            </div>

            <div className={`flex items-center gap-4 pointer-events-auto ${theme.type === 'web95' ? 'bg-[#c0c0c0] p-2 border-2 border-t-white border-l-white border-r-black border-b-black' : ''}`}>
                <button 
                    onClick={togglePlay}
                    className={`w-10 h-10 ${styles.layoutShape} flex items-center justify-center transition-all ${styles.buttonPrimary}`}
                >
                    {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <div 
                    className="flex items-center gap-2 group/vol relative"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                >
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-8 h-8 ${styles.layoutShape} flex items-center justify-center transition-colors ${styles.button}`}
                    >
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${showVolumeSlider ? 'w-24 opacity-100' : 'w-0 opacity-0'}`}>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                setVolume(parseFloat(e.target.value));
                                if (parseFloat(e.target.value) > 0) setIsMuted(false);
                            }}
                            className={`w-20 h-1 rounded-lg appearance-none cursor-pointer ${theme.type === 'web95' ? 'bg-black border border-white' : 'bg-white/20'}`}
                        />
                    </div>
                </div>

                <div className="flex-1"></div>

                <div className="flex items-center gap-2 relative">
                    <div className="relative">
                        <button
                            onClick={() => setShowAlarmPicker(!showAlarmPicker)}
                            className={`p-2 ${styles.layoutShape} transition-all ${showAlarmPicker ? styles.buttonActive : styles.button}`}
                            title="设置提醒/闹钟"
                        >
                            <AlarmClock className="w-4 h-4" />
                        </button>
                        
                        {showAlarmPicker && (
                            <div className={`absolute bottom-full mb-3 right-0 ${styles.card} p-3 ${styles.layoutShape} shadow-xl w-56 z-50`}>
                                <h4 className={`text-xs font-bold ${styles.textMain} mb-2`}>添加提醒</h4>
                                <div className="flex gap-2">
                                    <input 
                                        type="time" 
                                        className={`flex-1 px-2 py-1 text-sm focus:outline-none ${styles.input} ${styles.layoutShape}`}
                                        value={alarmTime}
                                        onChange={(e) => setAlarmTime(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleSaveReminder}
                                        className={`${styles.buttonPrimary} p-1 rounded hover:opacity-90`}
                                        disabled={!alarmTime}
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowTranslate(!showTranslate)}
                        className={`p-2 ${styles.layoutShape} transition-all ${showTranslate ? styles.buttonActive : styles.button}`}
                        title="实时翻译字幕"
                    >
                        <Captions className="w-4 h-4" />
                    </button>

                    <button
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`p-2 ${styles.layoutShape} transition-all flex items-center gap-2 ${
                            isRecording 
                            ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                            : styles.button
                        }`}
                        title={isRecording ? "停止录制" : "开始录制"}
                    >
                         {isRecording ? <StopCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 bg-current rounded-full"></div></div>}
                    </button>

                    <button 
                        onClick={() => {
                           if (document.fullscreenElement) document.exitFullscreen();
                           else videoRefs[activePlayerIndex].current?.parentElement?.requestFullscreen();
                        }}
                        className={`p-2 ${styles.layoutShape} ${styles.button}`}
                    >
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="flex items-start justify-between px-2">
        <div className="flex items-center gap-3 overflow-hidden">
             <div className={`w-10 h-10 ${styles.layoutShape} ${styles.bgSidebar} border ${styles.border} p-1.5 shrink-0`}>
                 {channel.logo ? (
                     <img src={channel.logo} alt="logo" className="w-full h-full object-contain" />
                 ) : (
                     isRadio ? <Radio className={`w-full h-full ${styles.textDim}`} /> : <TvIcon className={`w-full h-full ${styles.textDim}`} />
                 )}
             </div>
             <div className="min-w-0">
                 <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-lg ${styles.textMain} truncate`}>{channel.name}</h3>
                    
                    <div className="flex items-end gap-0.5 h-4 w-6 ml-1" title={`Signal: ${signalStrength}/4`}>
                         {[1,2,3,4].map(bar => (
                             <div 
                                key={bar} 
                                className={`flex-1 rounded-sm transition-all duration-500 ${
                                    signalStrength >= bar 
                                        ? (signalStrength < 3 ? 'bg-yellow-500' : 'bg-green-500') 
                                        : 'bg-white/10'
                                }`}
                                style={{ height: `${bar * 25}%` }}
                             />
                         ))}
                    </div>

                    {/* Local Time Display */}
                    <div className={`flex items-center gap-1 ml-3 px-2 py-0.5 ${styles.card} ${styles.layoutShape} text-xs ${styles.textDim} border ${styles.border}`}>
                        <Clock className="w-3 h-3" />
                        <span className="font-mono">{currentTimeStr}</span>
                    </div>
                 </div>
                 
                 <p className={`text-sm ${styles.textDim} truncate opacity-80`}>
                     {isRadio ? '正在广播' : '正在直播'} • {channel.group || 'General'}
                 </p>
             </div>
        </div>

        <button 
            onClick={onToggleFavorite}
            className={`p-2.5 ${styles.layoutShape} border transition-all ${
                isFavorite 
                ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' 
                : `${styles.button} ${styles.border}`
            }`}
        >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500' : ''}`} />
        </button>
      </div>
    </div>
  );
};

const TvIcon = ({className}: {className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
);