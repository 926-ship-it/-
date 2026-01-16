import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppTheme, PetType, ChatMessage, Channel, Language } from '../types';
import { MessageCircle, X, Send, Bot, Cat, Dog, Rabbit, Sparkles, Wand2 } from 'lucide-react';

interface AiChatPetProps {
  theme: AppTheme;
  currentChannels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  lang: Language;
}

const TRANSLATIONS = {
  zh: {
    title: '智能陪聊伙伴',
    changePartner: '更换伙伴',
    choosePartner: '挑选一名聊天伙伴',
    partnerDesc: '它们会陪你聊天，并根据你的心情推荐频道',
    placeholder: '聊聊你想看的频道或心情...',
    recommend: '纠结看什么？点我推荐！',
    recommendPrompt: '有什么好频道推荐吗？',
    cat: '小猫', dog: '小狗', bunny: '兔子', robot: '机器人',
    fallback: '嗯... 正在为你搜索合适的信号源...'
  },
  en: {
    title: 'AI Companion',
    changePartner: 'Change Partner',
    choosePartner: 'Pick a Streaming Buddy',
    partnerDesc: 'They will chat with you and help pick stations',
    placeholder: 'Talk about channels or mood...',
    recommend: 'Unsure what to watch? Ask me!',
    recommendPrompt: 'Any channel recommendations?',
    cat: 'Cat', dog: 'Dog', bunny: 'Bunny', robot: 'Assistant',
    fallback: 'System searching frequencies... Hmm.'
  }
};

export const AiChatPet: React.FC<AiChatPetProps> = ({ theme, currentChannels, onSelectChannel, lang }) => {
  const [petType, setPetType] = useState<PetType>(() => (localStorage.getItem('ai_pet_type') as PetType) || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { styles } = theme;
  const t = TRANSLATIONS[lang];

  useEffect(() => { 
      if (petType) {
          localStorage.setItem('ai_pet_type', petType);
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
        let systemInstruction = `You are a virtual TV companion (${petType}) responding in ${lang === 'zh' ? 'Chinese' : 'English'}.
        Available channels: ${currentChannels.slice(0, 50).map(c => c.name).join(', ')}.
        Task: Chat with user and recommend channels based on mood using [[Channel Name]] format.
        Personality: ${petType === 'cat' ? '傲娇，爱吐槽，说话带点猫叫声' : petType === 'dog' ? '热情外向，忠诚，喜欢称呼用户为主人' : petType === 'bunny' ? '害羞腼腆，说话简短温柔' : '专业、客观的 AI 助手'}.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userMsg.text,
          config: { systemInstruction }
        });
        
        const responseText = response.text;
        const match = responseText?.match(/\[\[(.*?)\]\]/);
        
        if (match) {
            const recommendedName = match[1];
            const channel = currentChannels.find(c => c.name.toLowerCase().includes(recommendedName.toLowerCase()));
            if (channel) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: responseText.replace(/\[\[.*?\]\]/g, channel.name) + (lang === 'zh' ? " (已为你自动跳转频道)" : " (Switched to channel)")
                }]);
                onSelectChannel(channel);
                setLoading(false);
                return;
            }
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText || t.fallback }]);
    } catch (e) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: t.fallback }]);
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
        {showInvite && !loading && (
            <div onClick={() => handleSend(t.recommendPrompt)} className="absolute top-[60px] left-4 right-4 z-20 bg-cyan-500 text-black p-3 rounded-2xl shadow-2xl cursor-pointer animate-in slide-in-from-top-4 duration-500 hover:scale-105 transition-transform">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Wand2 className="w-4 h-4" /> {t.recommend}</span>
                </div>
            </div>
        )}

        <div className={`p-4 flex items-center justify-between border-b ${styles.border} shrink-0 bg-black/10`}>
             <div className={`flex items-center gap-3 ${styles.textMain} font-black uppercase tracking-widest text-[10px]`}>
                 <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                 <span>{t.title}</span>
             </div>
             {petType && (
                 <button onClick={() => { setPetType(null); setMessages([]); }} className={`text-[9px] font-bold ${styles.textDim} hover:${styles.textMain} transition-colors uppercase`}>
                     {t.changePartner}
                 </button>
             )}
        </div>

        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme.type === 'web95' ? 'bg-white' : ''} scrollbar-thin`} ref={scrollRef}>
            {!petType ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                    <div className="space-y-2">
                        <p className={`${styles.textMain} font-black text-xs uppercase tracking-tighter`}>{t.choosePartner}</p>
                        <p className={`${styles.textDim} text-[9px] uppercase tracking-widest opacity-60`}>{t.partnerDesc}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                        {(['cat', 'dog', 'bunny', 'robot'] as const).map(type => (
                            <button key={type} onClick={() => { setPetType(type); setMessages([{ id: 'init', role: 'model', text: lang === 'zh' ? `哈啰！我是你的${TRANSLATIONS.zh[type]}。今天想看点什么呢？` : `Hi! I'm your ${TRANSLATIONS.en[type]}. What to watch?` }]); }} className={`flex flex-col items-center gap-2 p-4 ${styles.button} ${styles.layoutShape} border ${styles.border} transition-all hover:scale-105 active:scale-95 group`}>
                                {getPetIcon(type, "w-8 h-8 transition-transform group-hover:rotate-6")}
                                <span className="text-[9px] font-black uppercase tracking-widest">{t[type]}</span>
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

        {petType && (
            <div className={`p-4 border-t ${styles.border} flex items-center gap-2 bg-black/5 shrink-0`}>
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={t.placeholder}
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
