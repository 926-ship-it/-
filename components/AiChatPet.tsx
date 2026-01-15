
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppTheme, PetType, ChatMessage, Channel } from '../types';
import { MessageCircle, X, Send, Bot, Cat, Dog, Rabbit, Sparkles, Wand2 } from 'lucide-react';

interface AiChatPetProps {
  theme: AppTheme;
  currentChannels: Channel[];
  onSelectChannel: (channel: Channel) => void;
}

export const AiChatPet: React.FC<AiChatPetProps> = ({ theme, currentChannels, onSelectChannel }) => {
  const [petType, setPetType] = useState<PetType>(() => (localStorage.getItem('ai_pet_type') as PetType) || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { styles } = theme;

  useEffect(() => { 
      if (petType) {
          localStorage.setItem('ai_pet_type', petType);
          // 3秒后显示一个小小的邀请气泡
          const timer = setTimeout(() => setShowInvite(true), 3000);
          return () => clearTimeout(timer);
      }
  }, [petType]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async (forcedText?: string) => {
    const text = forcedText || inputText;
    if (!text.trim() || !petType) return;
    
    setShowInvite(false);
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let systemInstruction = `你是一个虚拟电视伙伴 (${petType})。
        当前可用频道列表: ${currentChannels.slice(0, 50).map(c => c.name).join(', ')}。
        你的任务是陪用户聊天，并根据心情推荐频道。推荐时请用 [[频道名称]] 格式。
        语气设定: ${petType === 'cat' ? '傲娇、偶尔挖苦、喜欢喵喵叫' : petType === 'dog' ? '极度热情、忠诚、喜欢汪汪叫' : petType === 'bunny' ? '害羞、温柔、说话简短' : '专业、高效的 AI'}。
        回复必须使用中文，富有情感。`;

        const chat = ai.chats.create({ 
          model: 'gemini-3-flash-preview', 
          config: { systemInstruction } 
        });
        const result = await chat.sendMessage({ message: userMsg.text });
        const responseText = result.text;

        const match = responseText?.match(/\[\[(.*?)\]\]/);
        if (match) {
            const recommendedName = match[1];
            const channel = currentChannels.find(c => c.name.toLowerCase().includes(recommendedName.toLowerCase()));
            if (channel) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: responseText.replace(/\[\[.*?\]\]/g, channel.name) + " (已切换到该频道)"
                }]);
                onSelectChannel(channel);
                setLoading(false);
                return;
            }
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText || "我开小差了..." }]);
    } catch (e) {
        // 当连不上 Google（如无 VPN 环境）时的可爱降级逻辑
        let fallbackText = "嗯。嗯...";
        if (petType === 'cat') fallbackText = "喵？喵喵~ 喵呜。";
        else if (petType === 'dog') fallbackText = "汪！汪汪！汪汪汪！";
        else if (petType === 'bunny') fallbackText = "吱... 吱吱。";
        else if (petType === 'robot') fallbackText = "嗯。系统正在搜索频率... 嗯。";

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: fallbackText }]);
    } finally {
        setLoading(false);
    }
  };

  const getPetIcon = (type: PetType, className: string) => {
      switch (type) {
          case 'cat': return <Cat className={className} />;
          case 'dog': return <Dog className={className} />;
          case 'bunny': return <Rabbit className={className} />;
          case 'robot': return <Bot className={className} />;
          default: return <Bot className={className} />;
      }
  };

  return (
    <div className={`flex flex-col ${styles.card} ${styles.layoutShape} h-[450px] overflow-hidden border ${styles.border} transition-all duration-500 relative`}>
        {/* Proactive Invite Bubble */}
        {showInvite && !loading && (
            <div onClick={() => handleSend("有什么推荐的频道吗？")} className="absolute top-[60px] left-4 right-4 z-20 bg-cyan-500 text-black p-3 rounded-2xl shadow-2xl cursor-pointer animate-in slide-in-from-top-4 duration-500 hover:scale-105 transition-transform">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Wand2 className="w-4 h-4" /> 不知道看什么？点我推荐！</span>
                </div>
            </div>
        )}

        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${styles.border} shrink-0 bg-black/10`}>
             <div className={`flex items-center gap-3 ${styles.textMain} font-black uppercase tracking-widest text-[10px]`}>
                 <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                 <span>AI 陪聊助手</span>
             </div>
             {petType && (
                 <button onClick={() => { setPetType(null); setMessages([]); }} className={`text-[9px] font-bold ${styles.textDim} hover:${styles.textMain} transition-colors uppercase`}>
                     更换伙伴
                 </button>
             )}
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme.type === 'web95' ? 'bg-white' : ''} ${theme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`} ref={scrollRef}>
            {!petType ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                    <div className="space-y-2">
                        <p className={`${styles.textMain} font-black text-xs uppercase tracking-tighter`}>挑选一名直播伙伴</p>
                        <p className={`${styles.textDim} text-[9px] uppercase tracking-widest opacity-60`}>它们会陪你聊天并帮你选台</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                        {(['cat', 'dog', 'bunny', 'robot'] as const).map(type => (
                            <button key={type} onClick={() => { setPetType(type); setMessages([{ id: 'init', role: 'model', text: `嘿！我是你的${type === 'cat' ? '喵星人' : type === 'dog' ? '汪星人' : type === 'bunny' ? '兔兔' : '助手'}。想看点什么？跟我说说心情，或者直接让我推荐吧！` }]); }} className={`flex flex-col items-center gap-2 p-4 ${styles.button} ${styles.layoutShape} border ${styles.border} transition-all hover:scale-105 active:scale-95 group`}>
                                {getPetIcon(type, "w-8 h-8 transition-transform group-hover:rotate-6")}
                                <span className="text-[9px] font-black uppercase tracking-widest">{type === 'cat' ? '小猫' : type === 'dog' ? '小狗' : type === 'bunny' ? '兔子' : '助手'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[90%] px-4 py-2.5 ${styles.layoutShape} text-[11px] font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? `${styles.buttonPrimary} rounded-tr-none` : `${styles.card} rounded-tl-none border ${styles.border}`}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                             <div className={`${styles.card} px-4 py-3 ${styles.layoutShape} rounded-tl-none animate-pulse border ${styles.border}`}>
                                 <div className="flex gap-1.5 text-cyan-500">
                                     <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
                                     <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150"></div>
                                     <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-300"></div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Input Area */}
        {petType && (
            <div className={`p-4 border-t ${styles.border} flex items-center gap-2 bg-black/5 shrink-0`}>
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="跟伙伴聊聊频道或心情..."
                    className={`flex-1 ${styles.input} ${styles.layoutShape} px-4 py-2 text-[11px] focus:outline-none font-bold placeholder:opacity-40`}
                />
                <button onClick={() => handleSend()} disabled={!inputText.trim() || loading} className={`p-2.5 ${styles.layoutShape} ${styles.buttonPrimary} disabled:opacity-30 shadow-lg transition-all active:scale-90`}>
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>
        )}
    </div>
  );
};
