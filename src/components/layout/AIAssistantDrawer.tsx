import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  Lightbulb,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ChatMessage } from '../../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am your TrustHire AI Recruitment Assistant powered by Gemini. You can ask me to search candidates, summarize qualifications, draft interview questions, or analyze skill matches.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Show candidates with Python & React',
    'Summarize top applicants for Full Stack Engineer',
    'Draft 5 behavioral & technical interview questions',
    'Explain the certificate verification process',
    'What are my overall recruitment statistics?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.chatAI(query, conversationId);
      setConversationId(res.conversationId);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.response,
          timestamp: res.timestamp,
        },
      ]);
    } catch (err: any) {
      showToast(err.message || 'Failed to communicate with AI Assistant.', 'error');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your request. Please check your network connection or verify your Gemini configuration.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    showToast('Copied to clipboard.', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Conversation history cleared. How else can I assist your recruitment workflow?",
        timestamp: new Date().toISOString(),
      },
    ]);
    setConversationId(undefined);
    showToast('Conversation reset.', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-out Drawer */}
      <div className="relative z-50 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold leading-tight">TrustHire AI Assistant</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80">Context-aware recruitment intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested Prompts Pill Row */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0 flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Try:</span>
          </div>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 text-xs bg-white text-slate-700 hover:text-blue-600 hover:border-blue-300 border border-slate-200 rounded-lg shadow-2xs whitespace-nowrap transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex gap-3 text-sm ${isAI ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs ${
                    isAI
                      ? 'bg-gradient-to-tr from-blue-600 to-purple-600'
                      : 'bg-slate-700'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`relative group max-w-[85%]`}>
                  <div
                    className={`p-3.5 rounded-2xl shadow-xs leading-relaxed whitespace-pre-wrap ${
                      isAI
                        ? 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                        : 'bg-blue-600 text-white rounded-tr-xs font-normal'
                    }`}
                  >
                    {msg.content}
                  </div>

                  <div
                    className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 ${
                      isAI ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isAI && (
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-slate-700"
                        title="Copy response"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 text-sm items-start">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white bg-gradient-to-tr from-blue-600 to-purple-600 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 text-slate-500 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Consulting Gemini & recruitment database...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about candidates, jobs, resumes, verification..."
              className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            AI responses are informational suggestions to assist decision making.
          </p>
        </div>
      </div>
    </div>
  );
};
