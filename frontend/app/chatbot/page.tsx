'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Send, Bot, User as UserIcon, Loader2, Globe, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  createdAt: string;
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState<'en' | 'om'>('en');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/chatbot/history').then((res) => {
      setMessages(res.data);
    }).catch(() => toast.error('Failed to load chat history'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      language: lang,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        message: userMsg.content,
        language: lang,
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your chat history?')) return;
    
    setClearing(true);
    try {
      await api.delete('/chatbot/history');
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    } finally {
      setClearing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
        <div className="w-full max-w-3xl h-[80vh] flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-green-600 p-4 text-white flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">AgriLink Assistant</h1>
                <p className="text-xs text-green-100">Ask about weather, prices, or diseases</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* ✅ TEXT BUTTON for Clear History */}
              <button 
                onClick={handleClearHistory}
                disabled={clearing || messages.length === 0}
                className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white disabled:opacity-50 transition-colors"
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Clear History
              </button>

              <div className="h-4 w-px bg-white/30"></div>

              {/* Language Selector */}
              <div className="flex items-center gap-2 bg-green-700/50 rounded-lg p-1">
                <Globe className="h-4 w-4 ml-1 text-green-200" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                  className="bg-transparent text-white text-sm outline-none cursor-pointer pr-2"
                >
                  <option value="en" className="text-black">English</option>
                  <option value="om" className="text-black">Afaan Oromoo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Bot className="h-12 w-12 mb-2 text-gray-300" />
                <p>Start a conversation...</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {msg.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="p-3 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'om' ? 'Ergaa keessan barreessaa...' : 'Type a message...'}
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500/50"
            />
            <Button type="submit" disabled={!input.trim() || loading} className="h-11 w-11 rounded-full bg-green-600 hover:bg-green-700 p-0 flex-shrink-0">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Send className="h-5 w-5 text-white" />}
            </Button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}