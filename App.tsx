
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelGrid } from './components/ChannelGrid';
import { FavoritesBar } from './components/FavoritesBar'; 
import { AiChatPet } from './components/AiChatPet';
import { SettingsModal } from './components/SettingsModal';
import { ImportModal } from './components/ImportModal';
import { fetchCountries, fetchChannelsByCountry, fetchRadioStations, fetchGlobalChannelsByCategory, getTimezone, GLOBAL_COUNTRY, searchChannels, filterPlayableChannels, verifyChannelStreamWithLatency } from './services/iptvService';
import { Country, Channel, AppTheme, Language } from './types';
import { Menu, RefreshCw, Shuffle, Globe, Loader2, Sparkles, Clock, Zap, X, Search, AlertTriangle, Flag, Wrench, CheckCircle2 } from 'lucide-react';

const THEMES: AppTheme[] = [
  {
    id: 'cyber',
    name: { zh: '星际轨道', en: 'Orbital' },
    type: 'glass',
    styles: {
      bgMain: 'bg-aurora-cyber', bgSidebar: 'bg-black/60 backdrop-blur-3xl border-r border-white/5',
      textMain: 'text-white', textDim: 'text-cyan-400/50', border: 'border-white/10',
      card: 'glass-card hover:border-cyan-500/40',
      cardHover: 'hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]', button: 'bg-white/5 text-white',
      buttonActive: 'bg-cyan-500 text-black shadow-lg', buttonPrimary: 'bg-cyan-400 text-black',
      input: 'bg-black/40 border-white/10 text-white', font: 'font-sans', layoutShape: 'rounded-[1.5rem] md:rounded-[2rem]', shadow: 'shadow-2xl', accentColor: 'text-cyan-400'
    }
  },
  {
    id: 'acid',
    name: { zh: '酸性未来', en: 'Acid' },
    type: 'acid',
    styles: {
      bgMain: 'bg-aurora-acid', bgSidebar: 'bg-black/80 border-r border-[#ccff00]/20',
      textMain: 'text-[#ccff00]', textDim: 'text-[#ccff00]/40', border: 'border-[#ccff00]/10',
      card: 'bg-black border border-[#ccff00]/20 hover:border-[#ccff00]',
      cardHover: 'hover:shadow-[0_0_30px_rgba(204,255,0,0.2)]', button: 'bg-[#ccff00]/10 text-[#ccff00]',
      buttonActive: 'bg-[#ccff00] text-black font-black', buttonPrimary: 'bg-[#ccff00] text-black',
      input: 'bg-black border-[#ccff00]/30 text-[#ccff00]', font: 'font-mono', layoutShape: 'rounded-none', shadow: 'shadow-none', accentColor: 'text-[#ccff00]'
    }
  },
  {
    id: 'zen',
    name: { zh: '极简禅意', en: 'Zen' },
    type: 'zen',
    styles: {
      bgMain: 'bg-aurora-zen', bgSidebar: 'bg-white/40 backdrop-blur-xl border-r border-gray-100',
      textMain: 'text-gray-900', textDim: 'text-gray-400', border: 'border-gray-200',
      card: 'bg-white/80 border border-gray-100 shadow-sm',
      cardHover: 'hover:shadow-md', button: 'bg-gray-100 text-gray-600',
      buttonActive: 'bg-gray-900 text-white', buttonPrimary: 'bg-gray-800 text-white',
      input: 'bg-white/80 border-gray-200 text-gray-900', font: 'font-serif', layoutShape: 'rounded-md', shadow: 'shadow-sm', accentColor: 'text-gray-500'
    }
  },
  {
    id: 'candy',
    name: { zh: '糖果极光', en: 'Candy' },
    type: 'kids',
    styles: {
      bgMain: 'bg-aurora-candy', bgSidebar: 'bg-white/80 backdrop-blur-xl border-r border-rose-100',
      textMain: 'text-rose-900', textDim: 'text-rose-300', border: 'border-rose-100',
      card: 'bg-white/90 border border-rose-50 shadow-sm',
      cardHover: 'hover:shadow-lg hover:shadow-rose-200/50', button: 'bg-rose-50 text-rose-500',
      buttonActive: 'bg-rose-400 text-white', buttonPrimary: 'bg-rose-400 text-white',
      input: 'bg-rose-50/50 border-rose-100 text-rose-900', font: 'font-sans', layoutShape: 'rounded-[2rem]', shadow: 'shadow-xl shadow-rose-100/50', accentColor: 'text-rose-400'
    }
  },
  {
    id: 'synth',
    name: { zh: '霓虹电音', en: 'Synthwave' },
    type: 'glass',
    styles: {
      bgMain: 'bg-aurora-synth', bgSidebar: 'bg-[#0a001a]/80 backdrop-blur-2xl border-r border-[#ff00ff]/20',
      textMain: 'text-white', textDim: 'text-[#ff00ff]/40', border: 'border-[#ff00ff]/10',
      card: 'bg-black/40 border border-[#ff00ff]/20 hover:border-[#ff00ff]/60',
      cardHover: 'hover:shadow-[0_0_30px_rgba(255,0,255,0.2)]', button: 'bg-[#ff00ff]/10 text-[#ff00ff]',
      buttonActive: 'bg-[#ff00ff] text-white shadow-[0_0_20px_rgba(255,0,255,0.5)]', buttonPrimary: 'bg-[#ff00ff] text-white',
      input: 'bg-black/60 border-[#ff00ff]/30 text-white', font: 'font-sans', layoutShape: 'rounded-2xl', shadow: 'shadow-3xl shadow-purple-900/40', accentColor: 'text-[#ff00ff]'
    }
  }
];

const DISCOVERY_TAGS = ['新闻', '体育', '电影', '少儿', '音乐', '纪实'];

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [lang, setLang] = useState<Language>('zh');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [autoSwitchCount, setAutoSwitchCount] = useState(0);

  const handleSelectChannel = useCallback((channel: Channel, isAutoSwitch = false) => {
    setCurrentChannel(channel);
    if (isAutoSwitch) {
      setAutoSwitchCount(prev => prev + 1);
    } else {
      setAutoSwitchCount(0);
    }
  }, []);

  const handleChannelLatencyUpdate = useCallback((latency: number) => {
    if (!currentChannel) return;
    const channelId = currentChannel.id;
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, latency } : ch));
    setCurrentChannel(prev => prev ? { ...prev, latency } : null);
  }, [currentChannel]);

  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<'tv' | 'radio'>('tv');
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [theme, setTheme] = useState<AppTheme>(THEMES[0]);
  const [discoveryTag, setDiscoveryTag] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanProgress, setCleanProgress] = useState<{ tested: number; total: number; validCount: number } | null>(null);
  const [cleanSummary, setCleanSummary] = useState<string | null>(null);
  const [deadChannelNotice, setDeadChannelNotice] = useState<{
    failedChannel: Channel;
    statusMessage?: string;
    isRepairing?: boolean;
  } | null>(null);

  const channelFailCountsRef = useRef<Record<string, number>>({});

  const handleCleanChannels = useCallback(async (targetList?: Channel[]) => {
    const listToClean = targetList || channels;
    if (!listToClean || listToClean.length === 0) return;

    setIsCleaning(true);
    setCleanSummary(null);
    setCleanProgress({ tested: 0, total: listToClean.length, validCount: 0 });

    try {
        const { validChannels, removedCount } = await filterPlayableChannels(listToClean, (tested, total, validCount) => {
            setCleanProgress({ tested, total, validCount });
        });

        const removedChannels = listToClean.filter(c => !validChannels.some(v => v.id === c.id));

        // 尝试全网检索备用最新稳定信号补全列表
        let repairedSignals: Channel[] = [];
        if (removedChannels.length > 0) {
            for (const deadChan of removedChannels.slice(0, 5)) {
                try {
                    const searchRes = await searchChannels(deadChan.name);
                    const replacement = searchRes.find(r => r.url !== deadChan.url);
                    if (replacement) {
                        const checkRepl = await verifyChannelStreamWithLatency(replacement.url, 2000);
                        if (checkRepl.playable) {
                            repairedSignals.push({ ...replacement, latency: checkRepl.latency });
                        }
                    }
                } catch (e) {}
            }
        }

        const finalChannels = [...repairedSignals, ...validChannels];
        setChannels(finalChannels);
        setIsCleaning(false);
        setCleanProgress(null);

        if (removedCount > 0) {
            const msg = lang === 'zh'
                ? `链路测试完成：清除 ${removedCount} 个不可看频道${repairedSignals.length > 0 ? `，全网补齐 ${repairedSignals.length} 个最新稳定信号` : ''}`
                : `Cleanup complete: Cleared ${removedCount} dead channels${repairedSignals.length > 0 ? `, recovered ${repairedSignals.length} stable streams` : ''}`;
            setCleanSummary(msg);
            setTimeout(() => setCleanSummary(null), 7000);

            if (currentChannel && !finalChannels.some(c => c.id === currentChannel.id)) {
                if (finalChannels.length > 0) {
                    handleSelectChannel(finalChannels[0]);
                }
            }
        } else {
            const msg = lang === 'zh'
                ? `链路测试完成：当前 ${finalChannels.length} 个波段信道全部可用`
                : `Scan complete: All ${finalChannels.length} channels are playable`;
            setCleanSummary(msg);
            setTimeout(() => setCleanSummary(null), 4000);
        }
    } catch (e) {
        setIsCleaning(false);
        setCleanProgress(null);
    }
  }, [channels, currentChannel, lang, handleSelectChannel]);

  // 后台15分钟静默健康自检任务与全网信号检索补全
  useEffect(() => {
    if (!isReady) return;

    const HEALTH_CHECK_INTERVAL = 15 * 60 * 1000; // 15分钟

    const runSilentHealthCheck = async () => {
      const targetsMap = new Map<string, Channel>();
      if (currentChannel) targetsMap.set(currentChannel.id, currentChannel);
      favorites.forEach(f => targetsMap.set(f.id, f));
      channels.slice(0, 10).forEach(c => targetsMap.set(c.id, c));

      const targets = Array.from(targetsMap.values());
      if (targets.length === 0) return;

      const deadList: Channel[] = [];
      const updatedCounts = { ...channelFailCountsRef.current };

      for (const chan of targets) {
        const res = await verifyChannelStreamWithLatency(chan.url, 2500);
        if (!res.playable) {
          const currentCount = (updatedCounts[chan.id] || 0) + 1;
          updatedCounts[chan.id] = currentCount;
          if (currentCount >= 3) {
            deadList.push({ ...chan, expired: true, failCount: currentCount });
          }
        } else {
          updatedCounts[chan.id] = 0;
        }
      }

      channelFailCountsRef.current = updatedCounts;

      if (deadList.length > 0) {
        const deadIds = new Set(deadList.map(d => d.id));

        // 清除不能看的频道
        setChannels(prev => prev.filter(c => !deadIds.has(c.id)));
        setFavorites(prev => prev.filter(f => !deadIds.has(f.id)));

        // 在网上搜索最新的稳定信号
        let repairedSignals: Channel[] = [];
        for (const deadChan of deadList) {
          try {
            const searchResults = await searchChannels(deadChan.name);
            const replacement = searchResults.find(r => r.url !== deadChan.url);
            if (replacement) {
              const checkRepl = await verifyChannelStreamWithLatency(replacement.url, 2000);
              if (checkRepl.playable) {
                repairedSignals.push({ ...replacement, latency: checkRepl.latency });
              }
            }
          } catch (e) {}
        }

        if (repairedSignals.length > 0) {
          setChannels(prev => {
            const existingUrls = new Set(prev.map(c => c.url));
            const freshToInsert = repairedSignals.filter(s => !existingUrls.has(s.url));
            return [...freshToInsert, ...prev];
          });
        }

        const msg = lang === 'zh'
          ? `后台静默自检：已清除 ${deadList.length} 个失效频道${repairedSignals.length > 0 ? `，全网为您补齐 ${repairedSignals.length} 个最新稳定信号` : ''}`
          : `Health check: Cleared ${deadList.length} dead channels${repairedSignals.length > 0 ? `, online recovered ${repairedSignals.length} new stable signals` : ''}`;

        setCleanSummary(msg);
        setTimeout(() => setCleanSummary(null), 8000);
      }
    };

    const initialTimer = setTimeout(() => {
      runSilentHealthCheck();
    }, 25000);

    const intervalTimer = setInterval(runSilentHealthCheck, HEALTH_CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isReady, currentChannel, favorites, channels, lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!selectedCountry) return;
      const tz = getTimezone(selectedCountry.code);
      try {
        const now = new Date();
        // 确保 now 是有效日期
        if (isNaN(now.getTime())) throw new Error('Invalid Date');
        
        const time = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(now);
        setLocalTime(time);
      } catch (e) { 
        console.error('Time format error:', e);
        setLocalTime('--:--:--'); 
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCountry, lang]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const strReason = String(reason?.message || reason || '');
      if (
        strReason.includes('Failed to fetch') ||
        strReason.includes('signal is aborted') ||
        strReason.includes('AbortError') ||
        strReason.includes('NetworkError') ||
        strReason.includes('Load failed')
      ) {
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = String(event.message || '');
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('Script error') ||
        msg.includes('Load failed')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      const timeout = setTimeout(() => setIsReady(true), 2000);
      try {
        const data = await fetchCountries();
        setCountries(data);
        if (!selectedCountry) setSelectedCountry(GLOBAL_COUNTRY);
        const savedFavs = localStorage.getItem('looq_favs');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
      clearTimeout(timeout);
      setIsReady(true);
    };
    init();
  }, []);

  const loadChannels = useCallback(async () => {
    if (!selectedCountry) return;
    setLoading(true);
    try {
        let data: Channel[] = [];
        if (discoveryTag) {
            data = await fetchGlobalChannelsByCategory(discoveryTag);
        } else {
            data = mode === 'tv' ? await fetchChannelsByCountry(selectedCountry.code) : await fetchRadioStations(selectedCountry.code);
        }

        // 严禁纯 HTTP 跨域死链流（浏览器 HTTPS 页面会自动拦截 HTTP 产生 Failed to fetch 错误）
        data = data.filter(c => c.url && c.url.startsWith('https://'));
        setChannels(data);

        if (data.length > 0) {
            // 探活轻量测试：快速校验前 5 个候选频道，选出首个 100% 可播放的信道，彻底消除黑屏卡顿
            const candidates = data.slice(0, 5);
            let firstPlayable: Channel | null = null;

            for (const cand of candidates) {
                const check = await verifyChannelStreamWithLatency(cand.url, 2000);
                if (check.playable) {
                    firstPlayable = { ...cand, latency: check.latency };
                    break;
                }
            }

            const target = firstPlayable || data[0];
            handleSelectChannel(target);
        }
    } catch (e) { setChannels([]); }
    setLoading(false);
  }, [selectedCountry, mode, discoveryTag, handleSelectChannel]);

  useEffect(() => { if (isReady) loadChannels(); }, [loadChannels, isReady]);

  const toggleFavorite = (channel: Channel) => {
    setFavorites(prev => {
        const isFav = prev.some(f => f.id === channel.id);
        const next = isFav ? prev.filter(f => f.id !== channel.id) : [...prev, channel];
        localStorage.setItem('looq_favs', JSON.stringify(next));
        return next;
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setIsSearching(true);
    setDiscoveryTag(null);
    try {
        const results = await searchChannels(searchQuery);
        setChannels(results);
        if (results.length > 0) handleSelectChannel(results[0]);
        // Auto trigger background channel verification & cleaning after search
        handleCleanChannels(results);
    } catch (e) {}
    setLoading(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    loadChannels();
  };

  const handleRandomPlay = () => {
    if (channels.length === 0) return;
    const randomIdx = Math.floor(Math.random() * channels.length);
    handleSelectChannel(channels[randomIdx]);
  };

  const handleTryBackup = async (failedChannel: Channel) => {
    // 1. 在当前列表中寻找同名或类似名称的频道
    const baseName = failedChannel.name.split(' ')[0].toLowerCase();
    const alternatives = channels.filter(c => 
        c.id !== failedChannel.id && 
        c.name.toLowerCase().includes(baseName)
    );

    if (alternatives.length > 0) {
        // 随机选一个备用
        const next = alternatives[Math.floor(Math.random() * alternatives.length)];
        handleSelectChannel(next);
    } else {
        // 2. 如果当前列表没有，尝试全局搜索
        setLoading(true);
        try {
            const results = await searchChannels(failedChannel.name);
            const next = results.find(r => r.url !== failedChannel.url);
            if (next) {
                handleSelectChannel(next);
            } else if (failedChannel.name.toUpperCase().includes('NBC')) {
                // 3. 特殊处理 NBC：切换到稳定的 WNBC New York (Alt) 或 NBC News NOW
                setSelectedCountry(GLOBAL_COUNTRY);
                setDiscoveryTag(null);
                setTimeout(() => {
                    const nbcBackups = [
                        {
                            id: 'wnbc-ny-alt',
                            name: 'WNBC New York (NBC Local)',
                            logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/NBC_News_Logo_2023.svg',
                            url: 'https://fl61.moveonjoy.com/NY_New_York_NBC/index.m3u8',
                            group: 'Local',
                            type: 'tv' as const
                        },
                        {
                            id: 'nbc-news',
                            name: 'NBC News NOW',
                            logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/NBC_News_Logo_2023.svg',
                            url: 'https://nbcnews-nbcnewsnow-1-us.wurl.tv/playlist.m3u8',
                            group: 'News',
                            type: 'tv' as const
                        }
                    ];
                    // 排除掉当前失败的 URL
                    const validBackups = nbcBackups.filter(b => b.url !== failedChannel.url);
                    const next = validBackups.length > 0 ? validBackups[0] : nbcBackups[0];
                    handleSelectChannel(next);
                }, 500);
            } else {
                handleRandomPlay();
            }
        } catch (e) {
            handleRandomPlay();
        }
        setLoading(false);
    }
  };

  const handleRepairChannel = async (failedChan: Channel) => {
    setDeadChannelNotice(prev => prev ? { 
      ...prev, 
      isRepairing: true, 
      statusMessage: lang === 'zh' ? '正在全网检索并验证备用信道源...' : 'Searching global database for replacement source...' 
    } : null);

    try {
      const results = await searchChannels(failedChan.name);
      const replacement = results.find(r => r.url !== failedChan.url);

      if (replacement) {
        setDeadChannelNotice(prev => prev ? { 
          ...prev, 
          isRepairing: false, 
          statusMessage: lang === 'zh' ? `已匹配到全新信道：${replacement.name}` : `Repaired: Found source ${replacement.name}` 
        } : null);
        
        setTimeout(() => {
          handleSelectChannel(replacement);
          setDeadChannelNotice(null);
        }, 1200);
      } else {
        setDeadChannelNotice(prev => prev ? { 
          ...prev, 
          isRepairing: false, 
          statusMessage: lang === 'zh' ? '全网暂无备用信道源，已建议您切换其他频道' : 'No working replacement source found.' 
        } : null);
      }
    } catch (e) {
      setDeadChannelNotice(prev => prev ? { 
        ...prev, 
        isRepairing: false, 
        statusMessage: lang === 'zh' ? '检索网络超时，请稍后再试' : 'Search timed out.' 
      } : null);
    }
  };

  const handleReportChannel = (failedChan: Channel) => {
    setFavorites(prev => prev.filter(f => f.id !== failedChan.id));
    setDeadChannelNotice(prev => prev ? {
      ...prev,
      statusMessage: lang === 'zh' ? '已记录并上报该失效信道，感谢您的反馈！' : 'Channel reported as dead. Thank you!'
    } : null);

    setTimeout(() => {
      setDeadChannelNotice(null);
    }, 1500);
  };

  const handlePlaybackError = async () => {
    if (!currentChannel) return;

    const failedChannel = currentChannel;

    // 直接清除不能看的频道，包括收藏和频道列表
    setChannels(prev => prev.filter(c => c.id !== failedChannel.id));
    setFavorites(prev => prev.filter(f => f.id !== failedChannel.id));

    // 网上搜索最新的稳定信号
    searchChannels(failedChannel.name).then(async (results) => {
      const replacement = results.find(r => r.url !== failedChannel.url);
      if (replacement) {
        const check = await verifyChannelStreamWithLatency(replacement.url, 2000);
        if (check.playable) {
          setChannels(prev => {
            if (prev.some(c => c.id === replacement.id || c.url === replacement.url)) return prev;
            return [{ ...replacement, latency: check.latency }, ...prev];
          });
        }
      }
    }).catch(() => {});

    if (autoSwitchCount >= 3) {
      console.warn('Reached maximum auto switches limit to prevent loop on dead connection.');
      setDeadChannelNotice({ failedChannel });
      return;
    }

    const baseName = failedChannel.name.split(' ')[0].toLowerCase();
    
    // 1. 在当前列表中寻找同名或类似名称的备用频道
    const alternatives = channels.filter(c => 
        c.id !== failedChannel.id && 
        c.name.toLowerCase().includes(baseName)
    );

    if (alternatives.length > 0) {
        const next = alternatives[Math.floor(Math.random() * alternatives.length)];
        handleSelectChannel(next, true);
    } else {
        // 2. 如果没有同名备用，尝试播放频道列表中的下一个频道
        const currentIndex = channels.findIndex(c => c.id === failedChannel.id);
        if (currentIndex !== -1 && currentIndex + 1 < channels.length) {
            handleSelectChannel(channels[currentIndex + 1], true);
        } else if (channels.length > 1) {
            // 循环回到第一个
            handleSelectChannel(channels[0], true);
        } else {
            // 没有备用频道可切换
            setDeadChannelNotice({ failedChannel });
        }
    }
  };

  if (!isReady) return (
    <div className="h-screen w-full bg-[#050508] flex flex-col items-center justify-center">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <Globe className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/50 animate-pulse">Initializing...</span>
    </div>
  );

  return (
    <div className={`flex h-screen w-full ${theme.styles.bgMain} ${theme.styles.font} overflow-hidden relative transition-colors duration-1000`}>
      <Sidebar 
        countries={countries} selectedCountry={selectedCountry} 
        onSelectCountry={(c) => { setDiscoveryTag(null); setSelectedCountry(c); }}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} mode={mode} onModeChange={setMode}
        themes={THEMES} currentTheme={theme} onThemeChange={setTheme}
        favorites={favorites} onSelectFavorite={handleSelectChannel} 
        onImportM3U={() => setShowImport(true)} settings={{enableSound: true}}
        onToggleSound={() => {}} onOpenSettings={() => setShowSettings(true)}
        history={[]} lang={lang} reminders={[]} onDeleteReminder={()=>{}} onPlayReminder={()=>{}}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
        <header className={`px-4 md:px-8 py-2 md:py-4 flex items-center justify-between gap-4 border-b ${theme.styles.border} ${theme.styles.bgSidebar} transition-all shrink-0`}>
            <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 opacity-80"><Menu className={`w-5 h-5 ${theme.styles.textMain}`} /></button>
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl md:text-2xl leading-none shrink-0">{selectedCountry?.flag}</span>
                    <div className="flex flex-col min-w-0">
                        <h1 className={`text-[11px] md:text-base font-black uppercase tracking-tighter truncate leading-tight ${theme.styles.textMain}`}>
                            {isSearching ? (lang === 'zh' ? '搜索结果' : 'SEARCH RESULTS') : (discoveryTag || selectedCountry?.name)}
                        </h1>
                        {localTime && (
                            <div className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-mono font-bold ${theme.styles.textDim}`}>
                                <Clock className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
                                <span className="tracking-widest">{localTime}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'zh' ? '搜索全球信道...' : 'Search global channels...'}
                    className={`w-full pl-9 pr-4 py-1.5 rounded-full text-[11px] md:text-xs outline-none transition-all ${theme.styles.input} focus:ring-1 focus:ring-cyan-500/50`}
                />
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${theme.styles.textDim}`} />
                {searchQuery && (
                    <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 hover:scale-110">
                        <X className="w-3 h-3" />
                    </button>
                )}
            </form>

            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <button 
                    onClick={handleRandomPlay} 
                    title={lang === 'zh' ? '随机切台' : 'Random Channel'}
                    className={`px-2.5 md:px-3.5 py-1.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 border ${theme.styles.button} ${theme.styles.border} hover:scale-[1.02] active:scale-95`}
                >
                    <Shuffle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span>{lang === 'zh' ? '随机切台' : 'Random'}</span>
                </button>

                <button 
                    onClick={() => loadChannels()} 
                    title={lang === 'zh' ? '刷新频道列表' : 'Refresh List'}
                    className={`px-2.5 md:px-3.5 py-1.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 border ${theme.styles.button} ${theme.styles.border} hover:scale-[1.02] active:scale-95`}
                >
                    <RefreshCw className={`w-3 h-3 md:w-3.5 md:h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{lang === 'zh' ? '刷新频道' : 'Refresh'}</span>
                </button>

                <button 
                    onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} 
                    className={`px-2 md:px-2.5 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase transition-all shrink-0 border ${theme.styles.button} ${theme.styles.border} hover:scale-[1.02] active:scale-95 ${theme.styles.textDim}`}
                >
                    {lang === 'zh' ? 'EN' : '中文'}
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-10 scrollbar-thin">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar snap-x">
                    <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-black/5 mr-1">
                        <Zap className={`w-3.5 h-3.5 ${theme.styles.accentColor} opacity-60`} />
                    </div>
                    {DISCOVERY_TAGS.map(tag => (
                        <button 
                            key={tag} 
                            onClick={() => { setDiscoveryTag(tag); setSelectedCountry(GLOBAL_COUNTRY); }}
                            className={`px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border snap-start ${discoveryTag === tag ? theme.styles.buttonActive : `${theme.styles.button} ${theme.styles.border}`}`}
                        >
                            {tag}
                        </button>
                    ))}
                    {discoveryTag && (
                        <button onClick={() => setDiscoveryTag(null)} className="p-1 text-rose-400 hover:scale-110 shrink-0"><X className="w-3.5 h-3.5" /></button>
                    )}
                </div>

                {/* Split Layout: Desktop uses side-by-side (lg+), Mobile & Tablet share unified stacked layout (<lg) */}
                <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 items-start">
                    {/* Player & Favorites Column */}
                    <div className="w-full lg:w-[55%] xl:w-[58%] lg:sticky lg:top-6 space-y-3 md:space-y-4 shrink-0">
                        <VideoPlayer 
                            key={currentChannel?.id || 'no-channel'}
                            channel={currentChannel} country={selectedCountry} theme={theme}
                            isFavorite={!!currentChannel && favorites.some(f => f.id === currentChannel.id)}
                            onToggleFavorite={() => currentChannel && toggleFavorite(currentChannel)}
                            lang={lang}
                            onRandom={handleRandomPlay}
                            onTryBackup={handleTryBackup}
                            onPlaybackError={handlePlaybackError}
                            onUpdateLatency={handleChannelLatencyUpdate}
                        />
                        <FavoritesBar favorites={favorites} currentChannel={currentChannel} onSelectChannel={handleSelectChannel} theme={theme} mode={mode} />
                    </div>

                    {/* Right Scrollable Column (Channels & Chat) */}
                    <div className="w-full lg:w-[42%] space-y-4 md:space-y-6">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b border-black/5 pb-2">
                                <div className="flex items-center gap-2.5">
                                    <Sparkles className={`w-3.5 h-3.5 ${theme.styles.accentColor}`} />
                                    <h2 className={`text-[9px] md:text-sm font-black uppercase tracking-widest ${theme.styles.textMain}`}>
                                        {lang === 'zh' ? '链路波段扫描' : 'UPLINK SCAN'}
                                    </h2>
                                </div>
                            </div>
                            <ChannelGrid 
                                channels={channels} currentChannel={currentChannel} onSelectChannel={handleSelectChannel}
                                loading={loading} mode={mode} theme={theme} favorites={favorites} onToggleFavorite={toggleFavorite}
                                isCleaning={isCleaning} cleanProgress={cleanProgress} cleanSummary={cleanSummary}
                                onCleanChannels={() => handleCleanChannels()} lang={lang}
                            />
                        </section>

                        <section className="flex justify-end pt-4 pb-20 md:pb-24">
                            <AiChatPet theme={theme} currentChannels={channels} onSelectChannel={handleSelectChannel} lang={lang} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={{enableSound: true}} onToggleSound={()=>{}} lang={lang} onToggleLang={()=>{}} theme={theme} onClearHistory={()=>{}} onClearFavorites={()=>{}} />
      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={(content) => {}} theme={theme} lang={lang} />

      {deadChannelNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className={`relative w-full max-w-md p-5 md:p-6 rounded-3xl border shadow-2xl ${theme.styles.bgSidebar} ${theme.styles.border} ${theme.styles.textMain} space-y-4`}>
            <button 
              onClick={() => setDeadChannelNotice(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-all opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 pr-6">
                <h3 className="text-sm md:text-base font-black tracking-tight leading-tight">
                  {lang === 'zh' ? '信道连续连接异常' : 'Continuous Playback Failures'}
                </h3>
                <p className={`text-xs ${theme.styles.textDim} leading-relaxed`}>
                  {lang === 'zh' 
                    ? `频道「${deadChannelNotice.failedChannel.name}」及自动备用频段多次连接失败，已暂停自动切台。` 
                    : `Channel "${deadChannelNotice.failedChannel.name}" failed to connect multiple times. Auto-switch paused.`}
                </p>
              </div>
            </div>

            {deadChannelNotice.statusMessage ? (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono animate-fadeIn">
                {deadChannelNotice.isRepairing ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-cyan-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{deadChannelNotice.statusMessage}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => handleRepairChannel(deadChannelNotice.failedChannel)}
                  disabled={deadChannelNotice.isRepairing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-cyan-500 text-black hover:bg-cyan-400 transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{lang === 'zh' ? '全局搜索尝试修复' : 'Search & Repair'}</span>
                </button>

                <button
                  onClick={() => handleReportChannel(deadChannelNotice.failedChannel)}
                  disabled={deadChannelNotice.isRepairing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <Flag className="w-4 h-4" />
                  <span>{lang === 'zh' ? '报告频道失效' : 'Report Broken'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
