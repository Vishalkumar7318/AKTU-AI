import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BrainCircuit, Globe, Loader2, Sparkles } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage, ChatConfig } from '../types';
import { GenerateContentResponse } from '@google/genai';

const ChatTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: "Hi! I'm your AI Tutor. I can help you understand complex topics using deep reasoning, or find the latest information from the web." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ChatConfig>({ useThinking: false, useSearch: false });
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session when config changes
  useEffect(() => {
    chatSessionRef.current = createChatSession(config.useThinking, config.useSearch);
    // Optional: Add system message about mode change
  }, [config.useThinking, config.useSearch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
         chatSessionRef.current = createChatSession(config.useThinking, config.useSearch);
      }

      // Stream response
      const result = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullText = "";
      let groundingChunks: any[] = [];
      const modelMsgId = (Date.now() + 1).toString();
      
      // Add placeholder for streaming
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isThinking: config.useThinking }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || "";
        fullText += text;
        
        // Collect grounding metadata if available
        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          groundingChunks.push(...c.candidates[0].groundingMetadata.groundingChunks);
        }

        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText } : m));
      }

      // Final update with grounding sources
      const sources = groundingChunks
        .filter(c => c.web?.uri && c.web?.title)
        .map(c => ({ uri: c.web!.uri!, title: c.web!.title! }));

      // De-duplicate sources
      const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

      setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText, groundingSources: uniqueSources } : m));

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up">
      {/* Header / Config */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-600" />
          <h2 className="font-bold text-slate-800">Gemini 3 Pro Tutor</h2>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setConfig(p => ({ ...p, useThinking: !p.useThinking }))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              config.useThinking ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-500 border-slate-200 hover:border-purple-200'
            }`}
          >
            <BrainCircuit className="w-3 h-3" />
            Thinking Mode {config.useThinking ? 'ON' : 'OFF'}
          </button>
          
          <button 
             onClick={() => setConfig(p => ({ ...p, useSearch: !p.useSearch }))}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              config.useSearch ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200'
            }`}
          >
            <Globe className="w-3 h-3" />
            Web Search {config.useSearch ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
            }`}>
              {msg.isThinking && isLoading && msg.text.length < 50 && (
                 <div className="flex items-center gap-2 text-xs font-mono text-purple-600 mb-2 opacity-70">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    Thinking Process...
                 </div>
              )}
              
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {msg.text}
              </div>

              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingSources.map((src, i) => (
                      <a 
                        key={i} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 px-2 py-1 rounded border border-slate-200 hover:border-blue-200 truncate max-w-[200px]"
                      >
                        {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTutor;
