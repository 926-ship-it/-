
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppTheme, PetType, ChatMessage } from '../types';
import { MessageCircle, X, Send, Bot, Cat, Dog, Rabbit } from 'lucide-react';

interface AiChatPetProps {
  theme: AppTheme;
}

export const AiChatPet: React.FC<AiChatPetProps> = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [petType, setPetType] = useState<PetType>(() => {
    return (localStorage.getItem('ai_pet_type') as PetType) || null;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { styles } = theme;

  useEffect(() => {
    localStorage.setItem('ai_pet_type', petType || '');
  }, [petType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSelectPet = (type: PetType) => {
    setPetType(type);
    const introMsg = type === 'cat' ? "Meow! I'm your TV companion." 
                   : type === 'dog' ? "Woof! Happy to watch with you!" 
                   : type === 'bunny' ? "Hop hop! Let's watch something fun." 
                   : "Beep boop. System online.";
    setMessages([{ id: 'init', role: 'model', text: introMsg }]);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !petType) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
             setMessages(prev => [...prev, { 
                 id: Date.now().toString(), 
                 role: 'model', 
                 text: "I can't connect to my brain right now (API Key missing)." 
             }]);
             return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        let systemInstruction = "You are a helpful virtual assistant watching TV with the user.";
        if (petType === 'cat') systemInstruction += " You are a cute cat. End sentences with meow sometimes. Be brief and sassy.";
        if (petType === 'dog') systemInstruction += " You are an excited dog. Use woof sometimes. Be loyal and happy.";
        if (petType === 'bunny') systemInstruction += " You are a gentle bunny. Be soft and kind.";
        if (petType === 'robot') systemInstruction += " You are a robot. Be analytical and precise.";

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction }
        });

        const result = await chat.sendMessage({ message: userMsg.text });
        
        const responseText = result.text;

        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText || "..."
        }]);

    } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "Sorry, I got confused."
        }]);
    } finally {
        setLoading(false);
    }
  };

  // Render Pet Icon
  const getPetIcon = (type: PetType, className: string) => {
      switch (type) {
          case 'cat': return <Cat className={className} />;
          case 'dog': return <Dog className={className} />;
          case 'bunny': return <Rabbit className={className} />;
          case 'robot': return <Bot className={className} />;
          default: return <Bot className={className} />;
      }
  };

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className={`fixed top-24 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 transition-transform hover:scale-110 ${styles.buttonPrimary} text-white`}
          >
              {petType ? getPetIcon(petType, "w-8 h-8") : <MessageCircle className="w-8 h-8" />}
          </button>
      );
  }

  return (
    <div className={`
        fixed top-24 right-6 w-80 md:w-96 h-[500px] ${styles.layoutShape} shadow-2xl z-50 flex flex-col overflow-hidden 
        ${styles.border} ${styles.bgMain} ${styles.shadow}
    `}>
        {/* Header */}
        <div className={`p-4 flex items-center justify-between ${styles.bgSidebar} border-b ${styles.border}`}>
             <div className={`flex items-center gap-2 ${styles.textMain} font-bold`}>
                 {petType ? getPetIcon(petType, "w-5 h-5") : <Bot className="w-5 h-5" />}
                 <span>AI 伴侣</span>
             </div>
             <button onClick={() => setIsOpen(false)} className={`${styles.textDim} hover:${styles.textMain}`}>
                 <X className="w-5 h-5" />
             </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 ${theme.type === 'web95' ? 'bg-white' : ''} ${theme.type === 'web95' ? 'scrollbar-web95' : 'scrollbar-thin'}`} ref={scrollRef}>
            {!petType ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <h3 className={`${styles.textMain} font-bold text-lg`}>选择你的伙伴</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleSelectPet('cat')} className={`flex flex-col items-center gap-2 p-4 ${styles.button} rounded-xl transition-colors text-pink-400`}>
                            <Cat className="w-10 h-10" />
                            <span>猫咪</span>
                        </button>
                        <button onClick={() => handleSelectPet('dog')} className={`flex flex-col items-center gap-2 p-4 ${styles.button} rounded-xl transition-colors text-orange-400`}>
                            <Dog className="w-10 h-10" />
                            <span>狗狗</span>
                        </button>
                        <button onClick={() => handleSelectPet('bunny')} className={`flex flex-col items-center gap-2 p-4 ${styles.button} rounded-xl transition-colors ${styles.textMain}`}>
                            <Rabbit className="w-10 h-10" />
                            <span>兔子</span>
                        </button>
                        <button onClick={() => handleSelectPet('robot')} className={`flex flex-col items-center gap-2 p-4 ${styles.button} rounded-xl transition-colors text-blue-400`}>
                            <Bot className="w-10 h-10" />
                            <span>机器人</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[80%] px-4 py-2 ${styles.layoutShape} text-sm
                                ${msg.role === 'user' 
                                    ? `${styles.buttonPrimary} rounded-br-none` 
                                    : `${styles.button} rounded-bl-none`}
                            `}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                             <div className={`${styles.button} px-4 py-2 ${styles.layoutShape} rounded-bl-none`}>
                                 <div className="flex gap-1">
                                     <div className={`w-1.5 h-1.5 ${styles.textDim} rounded-full animate-bounce`}></div>
                                     <div className={`w-1.5 h-1.5 ${styles.textDim} rounded-full animate-bounce delay-100`}></div>
                                     <div className={`w-1.5 h-1.5 ${styles.textDim} rounded-full animate-bounce delay-200`}></div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Input */}
        {petType && (
            <div className={`p-3 border-t ${styles.border} flex items-center gap-2 ${styles.bgSidebar}`}>
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="说点什么..."
                    className={`flex-1 ${styles.input} ${styles.layoutShape} px-4 py-2 text-sm focus:outline-none`}
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputText.trim() || loading}
                    className={`p-2 ${styles.layoutShape} ${styles.buttonPrimary} disabled:opacity-50`}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        )}
    </div>
  );
};
