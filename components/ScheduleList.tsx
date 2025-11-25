
import React from 'react';
import { Reminder, AppTheme, Channel } from '../types';
import { AlarmClock, Trash2, X, Play } from 'lucide-react';

interface ScheduleListProps {
  reminders: Reminder[];
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  theme: AppTheme;
  onPlayChannel: (channelId: string) => void;
  allChannels: Channel[];
}

export const ScheduleList: React.FC<ScheduleListProps> = ({
  reminders,
  isOpen,
  onClose,
  onDelete,
  theme,
  onPlayChannel,
  allChannels
}) => {
  if (!isOpen) return null;
  const { styles } = theme;

  // Sort reminders by time
  const sortedReminders = [...reminders].sort((a, b) => a.timeStr.localeCompare(b.timeStr));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md ${styles.bgMain} ${styles.layoutShape} ${styles.border} ${styles.shadow} flex flex-col max-h-[80vh]`}>
        
        {/* Header */}
        <div className={`p-4 border-b ${styles.border} flex items-center justify-between ${styles.bgSidebar}`}>
          <div className={`flex items-center gap-2 ${styles.textMain}`}>
            <AlarmClock className={`w-5 h-5`} />
            <h3 className="font-bold text-lg">我的节目单 / 提醒</h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full ${styles.textDim} hover:${styles.textMain}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${theme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`}>
          {sortedReminders.length === 0 ? (
            <div className={`text-center py-10 ${styles.textDim}`}>
              <AlarmClock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>暂无提醒</p>
              <p className="text-xs mt-1">在播放器中点击闹钟图标添加提醒</p>
            </div>
          ) : (
            sortedReminders.map(reminder => {
                const channelExists = allChannels.some(c => c.id === reminder.channelId);
                return (
                  <div 
                    key={reminder.id}
                    className={`flex items-center justify-between ${styles.card} ${styles.layoutShape} p-3 transition-colors group`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-xl font-mono font-bold ${styles.textMain} bg-black/30 px-2 py-1 rounded`}>
                        {reminder.timeStr}
                      </div>
                      <div className="flex flex-col">
                         <span className={`font-medium ${styles.textMain} line-clamp-1`}>{reminder.channelName}</span>
                         <span className={`text-xs ${styles.textDim}`}>每日提醒</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {channelExists && (
                            <button
                                onClick={() => {
                                    onPlayChannel(reminder.channelId);
                                    onClose();
                                }}
                                className={`p-2 rounded-full ${styles.button} hover:text-green-400 transition-colors`}
                                title="立即播放"
                            >
                                <Play className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(reminder.id)}
                            className={`p-2 rounded-full ${styles.button} hover:text-red-400 transition-colors`}
                            title="删除提醒"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                );
            })
          )}
        </div>
        
        <div className={`p-3 border-t ${styles.border} text-center text-xs ${styles.textDim}`}>
            当时间到达时，将会弹出提示。请保持网页开启。
        </div>
      </div>
    </div>
  );
};
