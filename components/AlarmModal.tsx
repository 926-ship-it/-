
import React, { useEffect, useRef } from 'react';
import { Reminder, AppTheme } from '../types';
import { AlarmClock, Play, X } from 'lucide-react';

interface AlarmModalProps {
  reminder: Reminder | null;
  onClose: () => void;
  onWatch: (channelId: string) => void;
  theme: AppTheme;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({ reminder, onClose, onWatch, theme }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { styles } = theme;

  useEffect(() => {
    if (reminder) {
      // Create a simple beeping sound using AudioContext or just visual
      // For now, we rely on the visual popup as browsers block autoplay audio often
    }
  }, [reminder]);

  if (!reminder) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className={`
        relative w-full max-w-sm ${styles.bgMain} ${styles.layoutShape} ${styles.border} ${styles.shadow} 
        p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-300
      `}>
        <div className={`w-16 h-16 rounded-full ${styles.buttonPrimary} flex items-center justify-center mb-4 animate-bounce`}>
          <AlarmClock className="w-8 h-8 text-white" />
        </div>
        
        <h3 className={`text-xl font-bold ${styles.textMain} mb-2`}>节目提醒</h3>
        <p className={`${styles.textDim} mb-6`}>
          现在是收看 <br/>
          <span className={`font-bold text-lg ${styles.textMain}`}>{reminder.channelName}</span>
          <br/> 的时间了 ({reminder.timeStr})
        </p>

        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose}
            className={`flex-1 py-3 ${styles.button} ${styles.layoutShape} font-medium`}
          >
            稍后再说
          </button>
          <button 
            onClick={() => onWatch(reminder.channelId)}
            className={`flex-1 py-3 ${styles.buttonPrimary} ${styles.layoutShape} font-bold flex items-center justify-center gap-2`}
          >
            <Play className="w-4 h-4" /> 立即观看
          </button>
        </div>
      </div>
    </div>
  );
};
