import React, { useState } from 'react';
import { 
  Tv, Monitor, Wifi, Copy, Check, ExternalLink, X, 
  Smartphone, Cast, Radio, ShieldCheck, Zap, Laptop, MonitorPlay, QrCode
} from 'lucide-react';
import { AppTheme, Channel, Language } from '../types';

interface CastModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
  theme: AppTheme;
  lang: Language;
  onStartSimulatedCast: (receiverName: string) => void;
  onTriggerNativeCast: () => void;
  isCasting: boolean;
  activeReceiverName: string | null;
  onStopCast: () => void;
}

export const CastModal: React.FC<CastModalProps> = ({
  isOpen,
  onClose,
  channel,
  theme,
  lang,
  onStartSimulatedCast,
  onTriggerNativeCast,
  isCasting,
  activeReceiverName,
  onStopCast,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'devices' | 'dlna' | 'web'>('devices');

  if (!isOpen || !channel) return null;

  const { styles } = theme;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(channel.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulatedReceivers = [
    { id: 'living-room-tv', name: lang === 'zh' ? '客厅 4K 智能电视' : 'Living Room 4K Smart TV', ip: '192.168.1.108', type: 'tv', icon: Tv },
    { id: 'bedroom-monitor', name: lang === 'zh' ? '卧室外接显示器' : 'Bedroom External Display', ip: '192.168.1.120', type: 'monitor', icon: Monitor },
    { id: 'looq-receiver', name: lang === 'zh' ? 'LOOQ 虚拟串流终端' : 'LOOQ Virtual Cast Screen', ip: '192.168.1.200', type: 'virtual', icon: MonitorPlay },
  ];

  const t = {
    zh: {
      title: '多屏投屏与外接显示器',
      subTitle: '将当前 HLS 信号源推送至局域网设备或虚拟显示终端',
      statusCasting: '当前正在投屏至',
      stopCast: '断开投屏',
      tabDevices: '局域网设备',
      tabDlna: 'DLNA / 串流地址',
      nativeCastBtn: '唤起浏览器原生 AirPlay / Chromecast 选择器',
      nativeCastDesc: '尝试搜索同一 Wi-Fi 网络下的 Chromecast、Apple TV 或 Smart TV',
      simulatedSection: '虚拟外接显示器 / 接收终端',
      simulatedDesc: '在当前界面模拟独立的第二屏幕或外接大屏监控',
      copySuccess: '流媒体 URL 已复制',
      copyBtn: '复制 HLS URL',
      dlnaTip: '您可以将此 HLS (M3U8) 链接输入到 VLC、Kodi 或电视端播放器中直接播放：',
      close: '关闭'
    },
    en: {
      title: 'Cast & External Display',
      subTitle: 'Cast current HLS stream to local receivers or virtual external monitor',
      statusCasting: 'Currently casting to',
      stopCast: 'Disconnect',
      tabDevices: 'Local Receivers',
      tabDlna: 'DLNA / Stream Link',
      nativeCastBtn: 'Trigger Native AirPlay / Chromecast Prompt',
      nativeCastDesc: 'Scan for Google Chromecast, Apple TV or Smart TV on local Wi-Fi',
      simulatedSection: 'Virtual External Monitor Overlay',
      simulatedDesc: 'Simulate a dedicated secondary screen or smart TV display overlay',
      copySuccess: 'Stream URL Copied',
      copyBtn: 'Copy HLS URL',
      dlnaTip: 'Paste this direct HLS (M3U8) URL into VLC, Kodi, or Smart TV player:',
      close: 'Close'
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg ${styles.layoutShape} ${styles.bgSidebar} border ${styles.border} shadow-2xl p-5 md:p-7 space-y-6 overflow-hidden`}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cast className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className={`text-base md:text-lg font-black uppercase tracking-wider ${styles.textMain}`}>
                {t.title}
              </h2>
              <p className={`text-[10px] md:text-xs font-mono ${styles.textDim}`}>
                {t.subTitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg opacity-70 hover:opacity-100 ${styles.button}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel info badge */}
        <div className={`p-3 rounded-xl bg-black/40 border ${styles.border} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3 min-w-0">
            {channel.logo ? (
              <img src={channel.logo} alt={channel.name} className="w-8 h-8 object-contain rounded shrink-0 bg-white/5 p-1" />
            ) : (
              <Radio className="w-6 h-6 text-cyan-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-xs font-black uppercase truncate text-white">{channel.name}</div>
              <div className="text-[9px] font-mono text-cyan-400/80 truncate">1080p HLS LIVE STREAM</div>
            </div>
          </div>

          {isCasting && (
            <button
              onClick={onStopCast}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider hover:bg-rose-500/30 transition-all shrink-0"
            >
              {t.stopCast}
            </button>
          )}
        </div>

        {/* Active Cast Status Banner */}
        {isCasting && (
          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 flex items-center gap-3 animate-fade-in">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <div className="text-xs font-bold">
              {t.statusCasting} <span className="text-white underline">{activeReceiverName}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/10 gap-2">
          <button
            onClick={() => setSelectedTab('devices')}
            className={`pb-2 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              selectedTab === 'devices'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {t.tabDevices}
          </button>
          <button
            onClick={() => setSelectedTab('dlna')}
            className={`pb-2 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              selectedTab === 'dlna'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            {t.tabDlna}
          </button>
        </div>

        {/* Content Tab 1: Local Devices */}
        {selectedTab === 'devices' && (
          <div className="space-y-4">
            {/* Native Cast Button */}
            <button
              onClick={onTriggerNativeCast}
              className={`w-full p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-all flex items-center gap-3.5 text-left group`}
            >
              <Wifi className="w-5 h-5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-black uppercase">{t.nativeCastBtn}</div>
                <div className="text-[10px] text-cyan-300/70">{t.nativeCastDesc}</div>
              </div>
            </button>

            {/* Simulated Monitors / Devices */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">
                {t.simulatedSection}
              </div>
              <p className="text-[10px] text-white/50">{t.simulatedDesc}</p>

              <div className="space-y-2 pt-1">
                {simulatedReceivers.map((rec) => {
                  const Icon = rec.icon;
                  const isActive = isCasting && activeReceiverName === rec.name;

                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        onStartSimulatedCast(rec.name);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                          : `bg-black/20 border-white/10 hover:border-cyan-500/40 hover:bg-white/5 text-white/80`
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-cyan-400 text-black' : 'bg-white/10 text-white'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{rec.name}</div>
                          <div className="text-[9px] font-mono text-white/40">{rec.ip} • LOOQ DISPLAY RECEIVER</div>
                        </div>
                      </div>

                      <button
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isActive
                            ? 'bg-cyan-400 text-black'
                            : 'bg-white/10 text-cyan-300 hover:bg-cyan-400 hover:text-black'
                        }`}
                      >
                        {isActive ? (lang === 'zh' ? '投屏中' : 'Casting') : (lang === 'zh' ? '连接大屏' : 'Cast')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content Tab 2: DLNA / Raw Link */}
        {selectedTab === 'dlna' && (
          <div className="space-y-4">
            <p className="text-xs text-white/70">{t.dlnaTip}</p>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <div className="text-[10px] font-mono text-cyan-400/80 uppercase">HLS Stream Source URL:</div>
              <div className="text-[11px] font-mono break-all text-white/90 p-2 bg-black/40 rounded border border-white/5 max-h-24 overflow-y-auto">
                {channel.url}
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.copySuccess : t.copyBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10`}
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
