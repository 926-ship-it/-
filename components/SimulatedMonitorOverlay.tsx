import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Tv, X, Maximize, Volume2, VolumeX, Radio, ShieldCheck, 
  Activity, Minimize2, Move, ExternalLink, RefreshCw
} from 'lucide-react';
import { AppTheme, Channel, Language } from '../types';

interface SimulatedMonitorOverlayProps {
  channel: Channel | null;
  theme: AppTheme;
  lang: Language;
  receiverName: string;
  onClose: () => void;
}

export const SimulatedMonitorOverlay: React.FC<SimulatedMonitorOverlayProps> = ({
  channel,
  theme,
  lang,
  receiverName,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!channel?.url || !videoRef.current) return;

    setIsLoading(true);
    setHasError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = channel.url;
    const isHls = url.toLowerCase().includes('m3u8');

    const playVideo = (el: HTMLVideoElement) => {
      const p = el.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch((err) => {
          if (err?.name === 'NotAllowedError') {
            setIsMuted(true);
            el.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
      }
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (videoRef.current) playVideo(videoRef.current);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setIsLoading(false);
          setHasError(true);
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl') || videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.oncanplay = () => {
        setIsLoading(false);
        if (videoRef.current) playVideo(videoRef.current);
      };
      videoRef.current.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  if (!channel) return null;

  const t = {
    zh: {
      castingTo: '投屏传输中',
      receiver: receiverName || '外接显示终端',
      live: 'LIVE 4K',
      signalOk: '信号质量 极佳',
      disconnect: '断开投屏',
      minimize: '悬浮显示',
      expand: '全屏大屏',
      error: '投屏信号断开，无法解析流'
    },
    en: {
      castingTo: 'Casting Active',
      receiver: receiverName || 'External Receiver',
      live: 'LIVE 4K',
      signalOk: 'Signal Excellent',
      disconnect: 'Disconnect',
      minimize: 'Floating Window',
      expand: 'Expand Screen',
      error: 'Cast stream error'
    }
  }[lang];

  return (
    <div 
      className={`fixed z-[95] transition-all duration-300 ${
        isMinimized 
          ? 'bottom-6 right-6 w-80 md:w-96 shadow-2xl rounded-2xl overflow-hidden border-2 border-cyan-400 bg-black/90'
          : 'fixed inset-4 md:inset-10 z-[95] flex flex-col items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)]'
      }`}
    >
      {/* External Monitor Frame Bezel Header */}
      <div className="w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5" />
              {t.receiver}
            </span>
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-wider">{t.castingTo} • {channel.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 transition-all"
            title={isMinimized ? t.expand : t.minimize}
          >
            {isMinimized ? <Maximize className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition-all text-[10px] font-black uppercase flex items-center gap-1"
            title={t.disconnect}
          >
            <X className="w-3.5 h-3.5" />
            {!isMinimized && <span>{t.disconnect}</span>}
          </button>
        </div>
      </div>

      {/* Main Display Screen Container */}
      <div className={`relative w-full ${isMinimized ? 'aspect-video' : 'flex-1 max-h-[75vh] aspect-video'} bg-black overflow-hidden flex items-center justify-center`}>
        {/* CRT / Scanlines Overlay effect for monitor look */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          muted={isMuted}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-20">
            <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest animate-pulse">
              SYNCING DISPLAY STREAM...
            </span>
          </div>
        )}

        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-2 p-4 text-center z-20">
            <X className="w-8 h-8 text-rose-500 mb-2" />
            <span className="text-xs font-bold text-rose-400 uppercase">{t.error}</span>
          </div>
        )}

        {/* On-screen TV OSD (On-Screen Display) watermark */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 text-white backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] font-black tracking-widest uppercase">{t.live}</span>
        </div>

        {/* Monitor HUD Control overlay at bottom */}
        <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 h-1 bg-white/20 rounded-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.signalOk}</span>
          </div>
        </div>
      </div>

      {/* Monitor Bottom Bezel Branding */}
      {!isMinimized && (
        <div className="w-full py-1.5 bg-neutral-900 border-t border-white/10 flex items-center justify-between px-4 text-[9px] font-mono text-white/40">
          <span>LOOQ MULTI-SCREEN CAST v2.4</span>
          <span className="text-cyan-400">STATUS: ACTIVE DISPLAY</span>
        </div>
      )}
    </div>
  );
};
