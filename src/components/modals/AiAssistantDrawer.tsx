import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  Sparkles,
  BookOpen,
  Code,
  Brain,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { sendAiChatMessage } from '../../services/kampusAiService';
import { useAuth } from '../../context/AuthContext';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  time: string;
  isError?: boolean;
  suggestions?: string[];
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  initialQuery,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'assistant',
      content: `Hi ${(profile?.name || 'Student').trim().split(/\s+/)[0]}! Ask any quick study doubt below, or open the full **KAMPUS AI Workspace** for Notes Generator, Quiz Runner, PDF AI, and Flashcards.`,
      time: 'Ready',
      suggestions: [
        'Explain Dynamic Programming on Trees',
        'Summarize Raft vs Paxos consensus',
        'Give 3 practice questions for DBMS mid-sem',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextFeed = [...messages, userMsg];
    setMessages(nextFeed);
    if (!textToSend) setInput('');
    setIsTyping(true);
    setLastFailedPrompt(null);

    try {
      const historyPayload = nextFeed
        .filter((m) => m.id !== 'm1' && !m.isError)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content,
        }));

      const { reply } = await sendAiChatMessage({
        messages: historyPayload,
        language: 'English',
        learningLevel: 'Intermediate',
        responseStyle: 'Detailed Explanation',
        studentContext: `${profile.name}, ${profile.course}, ${profile.semester}, ${profile.college}`,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          sender: 'assistant',
          content: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: ['Explain more simply', 'Give a practice example'],
        },
      ]);
    } catch (err: any) {
      setLastFailedPrompt(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          isError: true,
          content:
            err?.message ||
            'KAMPUS AI is currently unavailable. Please verify server Gemini API configuration.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs transition-opacity"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                KAMPUS AI Quick Copilot
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profile.college} Â· {profile.course}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/learn/kampus-ai');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 cursor-pointer"
            >
              <span>Full Studio</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : msg.isError
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 rounded-bl-xs border border-rose-200 dark:border-rose-800'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {msg.isError ? (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p>{msg.content}</p>
                      {lastFailedPrompt && (
                        <button
                          type="button"
                          onClick={() => handleSend(lastFailedPrompt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 text-xs font-semibold cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

                <div
                  className={`text-[10px] mt-1 text-right ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>

              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[95%]">
                  {msg.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(sug)}
                      className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 transition-colors text-left cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>KAMPUS AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick action prompts */}
        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <button
            onClick={() => handleSend('Explain Dynamic Programming on Trees')}
            className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 text-xs cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-blue-500" />
            <span>DP on Trees</span>
          </button>
          <button
            onClick={() => handleSend('Summarize Raft vs Paxos')}
            className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 text-xs cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Raft vs Paxos</span>
          </button>
          <button
            onClick={() => handleSend('Generate 3 practice questions for DBMS')}
            className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 text-xs cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-emerald-500" />
            <span>DBMS Quiz</span>
          </button>
        </div>

        {/* Input box */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about coursework, exams, algorithms..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 border border-transparent"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-opacity shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

