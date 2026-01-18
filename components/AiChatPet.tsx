
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppTheme, PetType, ChatMessage, Channel, Language } from '../types';
import { MessageCircle, X, Send, Bot, Cat, Dog, Rabbit, Sparkles, Wand2, Minus } from 'lucide-react';

interface AiChatPetProps {
  theme: AppTheme;
  currentChannels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  lang: Language;
}

const TRANSLATIONS = {
  zh: {
    title: '智聊终端',
    changePartner: '更换伙伴',
    choosePartner: '挑选伙伴',
    partnerDesc: '聊天并推荐频道',
    placeholder: '输入心情...',
    recommend: '获取推荐',
    recommendPrompt: '有什么好频道推荐吗？',
    cat: '小猫', dog: '小狗', bunny: '兔子', robot: '助手',
    fallback: '正在连接...',
    minimize: '最小化'
  },
  en: {
    title: 'AI Link',
    changePartner: 'Switch',
    choosePartner: 'Pick Buddy',
    partnerDesc: 'Mood-based suggestions',
    placeholder: 'Type...',
    recommend: 'Suggest',
    recommendPrompt: 'Any recommendations?',
    cat: 'Cat', dog: 'Dog', bunny: 'Bunny', robot: 'Bot',
    fallback: 'Connecting...',
    minimize: 'Minimize'
  }
};

export const AiChatPet: React.FC<AiChatPetProps> = ({ theme, currentChannels, onSelectChannel, lang }) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isExpanded]);

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
        Task: Chat with user and recommend channels based on mood using [[Channel Name]] format. personality: ${petType}.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userMsg.text,
          config: { systemInstruction }
        });
        
        const responseText = response.text;
        const match = responseText?.match(/\[\[(.*?)\]\]/);
        if (match) {
            const channel = currentChannels.find(c => c.name.toLowerCase().includes(match[1].toLowerCase()));
            if (channel) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText.replace(/\[\[.*?\]\]/g, channel.name) + " (Selected)" }]);
                onSelectChannel(channel);
                setLoading(false);
                return;
            }
        }
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText || t.fallback }]);
    } catch (e) { setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: t.fallback }]); } finally { setLoading(false); }
  };

  const getPetIcon = (type: PetType, className: string) => {
      switch (type) {
          case 'cat': return <Cat className={className} />;
          case 'dog': return <Dog className={className} />;
          case 'bunny': return <Rabbit className={className} />;
          case 'robot': return <Bot className={className} />;
          default: return <MessageCircle className={className} />;
      }
  };

  return (
    <div className="flex flex-col items-end gap-3 relative">
        {isExpanded && (
            <div className={`
                absolute bottom-16 md:bottom-20 right-0 w-72 md:w-80 h-[400px] md:h-[480px] flex flex-col ${styles.card} ${styles.layoutShape} overflow-hidden border ${styles.border} 
                shadow-3xl transition-all duration-500 animate-in slide-in-from-bottom-6 z-50
            `}>
                <div className={`p-3 md:p-4 flex items-center justify-between border-b ${styles.border} shrink-0 bg-black/20`}>
                     <div className={`flex items-center gap-2 ${styles.textMain} font-black uppercase tracking-widest text-[9px] md:text-[10px]`}>
                         <Sparkles className="w-3 h-3 text-yellow-400" />
                         <span>{t.title}</span>
                     </div>
                     <button onClick={() => setIsExpanded(false)} className={`p-1.5 rounded-lg hover:bg-white/10 ${styles.textDim}`}>
                        <Minus className="w-4 h-4" />
                     </button>
                </div>

                <div className={`flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-thin`} ref={scrollRef}>
                    {!petType ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <p className={`${styles.textMain} font-black text-[9px] uppercase tracking-widest`}>{t.choosePartner}</p>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                {(['cat', 'dog', 'bunny', 'robot'] as const).map(type => (
                                    <button key={type} onClick={() => { setPetType(type); setMessages([{ id: 'init', role: 'model', text: 'Hi!' }]); }} className={`flex flex-col items-center gap-2 p-3 ${styles.button} ${styles.layoutShape} border ${styles.border}`}>
                                        {getPetIcon(type, "w-5 h-5")}
                                        <span className="text-[7px] font-black uppercase tracking-widest">{t[type]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] px-3 py-1.5 ${styles.layoutShape} text-[10px] md:text-[11px] font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? `${styles.buttonPrimary} rounded-tr-none` : `${styles.card} rounded-tl-none border ${styles.border}`}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {petType && (
                    <div className={`p-3 md:p-4 border-t ${styles.border} flex items-center gap-2 bg-black/5 shrink-0`}>
                        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t.placeholder} className={`flex-1 ${styles.input} ${styles.layoutShape} px-3 py-1.5 text-[9px] focus:outline-none font-bold`} />
                        <button onClick={() => handleSend()} disabled={!inputText.trim() || loading} className={`p-2 ${styles.layoutShape} ${styles.buttonPrimary} disabled:opacity-30`}><Send className="w-3 h-3" /></button>
                    </div>
                )}
            </div>
        )}

        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
                w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center 
                ${isExpanded ? 'bg-white text-black' : `${styles.buttonPrimary} shadow-xl hover:scale-105 opacity-80 hover:opacity-100`}
                transition-all duration-500 border-2 border-white/20 relative group
            `}
        >
            {getPetIcon(petType, "w-5 h-5 md:w-7 h-7")}
            {!isExpanded && !loading && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span></span>}
        </button>
    </div>
  );
};
