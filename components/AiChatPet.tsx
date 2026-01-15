
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppTheme, PetType, ChatMessage, Channel } from '../types';
import { MessageCircle, X, Send, Bot, Cat, Dog, Rabbit, Sparkles } from 'lucide-react';

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
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { styles } = theme;

  useEffect(() => { if (petType) localStorage.setItem('ai_pet_type', petType); }, [petType]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !petType) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let systemInstruction = `你是一个虚拟电视伙伴 (${petType})。用户正在看电视。
        当前可用频道列表: ${currentChannels.slice(0, 50).map(c => c.name).join(', ')}。
        如果用户要求推荐或寻找内容，请在双方括号中提供频道名称，例如 [[频道名称]]。
        请始终使用中文回复，保持幽默且符合你的动物设定。`;
        
        if (petType === 'cat') systemInstruction += " 你是一只傲娇的小猫，喜欢挖苦但心肠不坏。";
        else if (petType === 'dog') systemInstruction += " 你是一只热情忠诚的小狗，超级兴奋。";
        else if (petType === 'bunny') systemInstruction += " 你是一只轻声细语、害羞的兔子。";

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
                    text: responseText.replace(/\[\[.*?\]\]/g, channel.name) + " (已为你找到该频道并自动切换)"
                }]);
                onSelectChannel(channel);
                setLoading(false);
                return;
            }
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText || "我没听清，能再说一次吗？喵/汪/嘘？" }]);
    } catch (e) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "哎呀，我的大脑断网了... 稍后再试试吧。" }]);
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
    <div className={`flex flex-col ${styles.card} ${styles.layoutShape} h-[450px] overflow-hidden border ${styles.border} transition-all duration-500`}>
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${styles.border} shrink-0 bg-black/10`}>
             <div className={`flex items-center gap-3 ${styles.textMain} font-black uppercase tracking-widest text-[10px]`}>
                 <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                 <span>AI 陪看助手</span>
             </div>
             {petType && (
                 <button onClick={() => setPetType(null)} className={`text-[9px] font-bold ${styles.textDim} hover:${styles.textMain} transition-colors uppercase`}>
                     更换伙伴
                 </button>
             )}
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${theme.type === 'web95' ? 'bg-white' : ''} ${theme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`} ref={scrollRef}>
            {!petType ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <p className={`${styles.textMain} font-black text-xs uppercase tracking-tighter opacity-70`}>选择你的收视伙伴</p>
                    <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                        {(['cat', 'dog', 'bunny', 'robot'] as const).map(type => (
                            <button key={type} onClick={() => { setPetType(type); setMessages([{ id: 'init', role: 'model', text: `你好呀！我是你的${type === 'cat' ? '傲娇小猫' : type === 'dog' ? '忠诚狗狗' : type === 'bunny' ? '害羞兔子' : '智能助手'}。告诉我你想看什么类型的频道？` }]); }} className={`flex flex-col items-center gap-2 p-4 ${styles.button} ${styles.layoutShape} border ${styles.border} transition-all hover:scale-105 active:scale-95 group`}>
                                {getPetIcon(type, "w-8 h-8 transition-transform group-hover:rotate-6")}
                                <span className="text-[9px] font-black uppercase tracking-widest">{type === 'cat' ? '小猫' : type === 'dog' ? '小狗' : type === 'bunny' ? '兔子' : '助手'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] px-4 py-2.5 ${styles.layoutShape} text-[11px] font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? `${styles.buttonPrimary} rounded-tr-none` : `${styles.card} rounded-tl-none border ${styles.border}`}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                             <div className={`${styles.card} px-4 py-3 ${styles.layoutShape} rounded-tl-none animate-pulse border ${styles.border}`}>
                                 <div className="flex gap-1.5">
                                     <div className={`w-1.5 h-1.5 ${styles.textDim} rounded-full animate-bounce`}></div>
                                     <div className={`w-1.5 h-1.5 ${styles.textDim} rounded-full animate-bounce delay-150`}></div>
                                     <div className={`w-1.5 h-1.5 ${styles.textDim} rounded-full animate-bounce delay-300`}></div>
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
                    placeholder="输入内容..."
                    className={`flex-1 ${styles.input} ${styles.layoutShape} px-4 py-2 text-[11px] focus:outline-none font-bold placeholder:opacity-40`}
                />
                <button onClick={handleSend} disabled={!inputText.trim() || loading} className={`p-2.5 ${styles.layoutShape} ${styles.buttonPrimary} disabled:opacity-30 shadow-lg transition-all active:scale-90`}>
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>
        )}
    </div>
  );
};
