import React from 'react';
import { AppTheme, AppSettings, Language } from '../types';
import { X, Volume2, VolumeX, Trash2, Languages, ShieldCheck, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onToggleSound: () => void;
  lang: Language;
  onToggleLang: () => void;
  theme: AppTheme;
  onClearHistory: () => void;
  onClearFavorites: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, settings, onToggleSound, lang, onToggleLang, theme, onClearHistory, onClearFavorites
}) => {
  if (!isOpen) return null;
  const { styles } = theme;

  const t = {
    zh: {
      title: '系统设置',
      audio: '交互音效',
      lang: '显示语言',
      clear: '数据清理',
      clearHistory: '清除历史记录',
      clearFavs: '清除我的收藏',
      on: '已开启',
      off: '已关闭',
      compliance: '合规性声明',
      complianceDesc: '本应用已严格屏蔽受限区域内容，所有频道流均来自公用卫星协议，仅供学习交流。',
      version: '版本: 3.0.4-Stable'
    },
    en: {
      title: 'Settings',
      audio: 'Sound Effects',
      lang: 'Language',
      clear: 'Data Management',
      clearHistory: 'Clear History',
      clearFavs: 'Clear Favorites',
      on: 'On',
      off: 'Off',
      compliance: 'Compliance',
      complianceDesc: 'This app filters restricted regions. All streams are from public satellite protocols.',
      version: 'v3.0.4-Stable'
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className={`relative w-full max-w-md ${styles.bgSidebar} ${styles.layoutShape} border ${styles.border} shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300`}>
        <div className={`p-6 border-b ${styles.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-black uppercase italic tracking-tighter ${styles.textMain}`}>{t.title}</h2>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-white/10 ${styles.textDim}`}><X /></button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto">
          {/* Audio Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${styles.textMain}`}>
                {settings.enableSound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-40" />}
              </div>
              <span className={`text-sm font-bold ${styles.textMain}`}>{t.audio}</span>
            </div>
            <button 
              onClick={onToggleSound}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${settings.enableSound ? styles.buttonActive : styles.button}`}
            >
              {settings.enableSound ? t.on : t.off}
            </button>
          </div>

          {/* Language Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${styles.textMain}`}>
                <Languages className="w-5 h-5" />
              </div>
              <span className={`text-sm font-bold ${styles.textMain}`}>{t.lang}</span>
            </div>
            <button 
              onClick={onToggleLang}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${styles.buttonActive}`}
            >
              {lang === 'zh' ? '简体中文' : 'English'}
            </button>
          </div>

          <div className={`h-[1px] ${styles.border} w-full opacity-50`}></div>

          {/* Data Clearance */}
          <div className="space-y-4">
             <h3 className={`text-[10px] font-black uppercase tracking-widest ${styles.textDim}`}>{t.clear}</h3>
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { if(confirm('确认清除播放历史？')) onClearHistory(); }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border ${styles.border} text-[10px] font-bold uppercase hover:bg-rose-500/20 hover:text-rose-500 transition-colors`}
                >
                  <Trash2 className="w-4 h-4" /> {t.clearHistory}
                </button>
                <button 
                  onClick={() => { if(confirm('确认清空我的收藏？')) onClearFavorites(); }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border ${styles.border} text-[10px] font-bold uppercase hover:bg-rose-500/20 hover:text-rose-500 transition-colors`}
                >
                  <Trash2 className="w-4 h-4" /> {t.clearFavs}
                </button>
             </div>
          </div>

          {/* Compliance */}
          <div className={`p-5 rounded-3xl bg-white/5 border ${styles.border} space-y-3`}>
             <div className="flex items-center gap-3 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-widest">{t.compliance}</span>
             </div>
             <p className={`text-[10px] leading-relaxed font-medium opacity-40`}>{t.complianceDesc}</p>
          </div>
        </div>

        <div className={`p-4 bg-black/40 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest ${styles.textDim}`}>
           <Info className="w-3 h-3" /> {t.version}
        </div>
      </div>
    </div>
  );
};
