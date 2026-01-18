
import React, { useState, useRef } from 'react';
import { AppTheme, Language } from '../types';
import { X, Link, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: string) => void;
  theme: AppTheme;
  lang: Language;
}

const TRANSLATIONS = {
  zh: {
    title: '导入外部信源',
    urlTab: '链接导入',
    fileTab: '文件导入',
    urlPlaceholder: '在此粘贴 .m3u 或 .m3u8 链接...',
    fileLabel: '点击或拖拽 M3U 文件到此处',
    importBtn: '立即解析',
    fetching: '正在从卫星拉取数据...',
    success: '导入成功',
    error: '拉取失败，请检查链接有效性',
    tip: '支持标准 M3U 协议，导入后将覆盖当前波段列表。'
  },
  en: {
    title: 'Import Source',
    urlTab: 'By Link',
    fileTab: 'By File',
    urlPlaceholder: 'Paste .m3u or .m3u8 link here...',
    fileLabel: 'Click or drop M3U file here',
    importBtn: 'Parse Now',
    fetching: 'Fetching frequency data...',
    success: 'Imported successfully',
    error: 'Fetch failed. Check URL.',
    tip: 'Standard M3U supported. This will replace current list.'
  }
};

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, theme, lang }) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { styles } = theme;
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleUrlImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setStatus('idle');
    try {
      // Proxy may be needed for CORS, but we try direct first
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error');
      const content = await response.text();
      onImport(content);
      setStatus('success');
      setTimeout(onClose, 1000);
    } catch (e) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onImport(ev.target.result as string);
          setStatus('success');
          setTimeout(onClose, 1000);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      
      <div className={`relative w-full max-w-lg ${styles.bgSidebar} ${styles.layoutShape} border ${styles.border} shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300`}>
        <div className={`p-6 border-b ${styles.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-black uppercase italic tracking-tighter ${styles.textMain}`}>{t.title}</h2>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-white/10 ${styles.textDim}`}><X /></button>
        </div>

        <div className="p-8 space-y-8">
          <div className={`flex p-1 ${styles.layoutShape} bg-black/20 border ${styles.border}`}>
             <button 
               onClick={() => setActiveTab('url')}
               className={`flex-1 flex items-center justify-center gap-2 py-3 ${styles.layoutShape} text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'url' ? styles.buttonActive : `${styles.textDim} hover:bg-white/5`}`}
             >
               <Link className="w-3.5 h-3.5" /> {t.urlTab}
             </button>
             <button 
               onClick={() => setActiveTab('file')}
               className={`flex-1 flex items-center justify-center gap-2 py-3 ${styles.layoutShape} text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'file' ? styles.buttonActive : `${styles.textDim} hover:bg-white/5`}`}
             >
               <Upload className="w-3.5 h-3.5" /> {t.fileTab}
             </button>
          </div>

          <div className="min-h-[160px] flex flex-col justify-center">
            {activeTab === 'url' ? (
               <div className="space-y-6">
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-40">
                      <Link className="w-4 h-4" />
                    </div>
                    <input 
                      type="url" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={t.urlPlaceholder}
                      className={`w-full ${styles.input} ${styles.layoutShape} pl-12 pr-4 py-4 text-xs font-bold focus:ring-2 ring-cyan-500/20 outline-none transition-all`}
                    />
                 </div>
                 <button 
                   onClick={handleUrlImport}
                   disabled={loading || !url.trim()}
                   className={`w-full py-5 ${styles.buttonPrimary} ${styles.layoutShape} font-black uppercase text-[11px] flex items-center justify-center gap-4 shadow-xl transition-all disabled:opacity-30`}
                 >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                   {loading ? t.fetching : t.importBtn}
                 </button>
               </div>
            ) : (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`border-2 border-dashed ${styles.border} ${styles.layoutShape} p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group`}
               >
                 <div className={`p-5 rounded-full bg-white/5 group-hover:scale-110 transition-transform ${styles.textMain}`}>
                    <Upload className="w-8 h-8" />
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${styles.textDim}`}>{t.fileLabel}</span>
                 <input type="file" ref={fileInputRef} className="hidden" accept=".m3u,.m3u8" onChange={handleFileChange} />
               </div>
            )}
          </div>

          {status === 'error' && (
             <div className="flex items-center gap-3 text-rose-500 bg-rose-500/10 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.error}</span>
             </div>
          )}

          <div className={`p-4 bg-black/20 rounded-2xl flex items-start gap-3 border ${styles.border}`}>
             <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 animate-pulse"></div>
             <p className={`text-[9px] font-medium leading-relaxed ${styles.textDim} opacity-60 uppercase tracking-wider`}>{t.tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
