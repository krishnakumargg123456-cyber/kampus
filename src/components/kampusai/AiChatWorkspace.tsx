import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Send,
  Square,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Edit3,
  Search,
  Bookmark,
  Eraser,
  FileText,
  X,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import { useAuth } from '../../context/AuthContext';
import {
  AiChatMessage,
  AiLanguage,
  AiLearningLevel,
  AiResponseStyle,
} from '../../types/kampusAi';
import { sendAiChatMessage, uploadAndExtractDocument } from '../../services/kampusAiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AiStatusBanner } from './AiStatusBanner';

const STYLES: AiResponseStyle[] = [
  'Simple Explanation',
  'Detailed Explanation',
  'Exam-Oriented Answer',
  'Short Revision Answer',
  'Beginner-Friendly Explanation',
];

export const AiChatWorkspace: React.FC = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversationId,
    createNewConversation,
    renameConversation,
    deleteConversation,
    clearActiveConversation,
    updateConversation,
    preferences,
    updatePreferences,
    toolDraftPrompt,
    setToolDraftPrompt,
    toolDraftAttachments,
    setToolDraftAttachments,
    addHistoryEntry,
    saveItem,
  } = useKampusAi();
  const { profile } = useAuth();

  const [input, setInput] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation.messages, isGenerating]);

  // Auto-send draft prompt launched from Home Dashboard or other modules
  useEffect(() => {
    if (toolDraftPrompt) {
      const promptToSend = toolDraftPrompt;
      const atts = [...toolDraftAttachments];
      setToolDraftPrompt(null);
      setToolDraftAttachments([]);
      executeSend(promptToSend, atts);
    }
  }, [toolDraftPrompt]);

  const filteredConversations = conversations.filter((c) => {
    const q = convSearch.trim().toLowerCase();
    return (
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const executeSend = async (textOverride?: string, draftAtts = toolDraftAttachments) => {
    const text = (textOverride ?? input).trim();
    if ((!text && draftAtts.length === 0) || isGenerating) return;

    const convId = activeConversation.id;
    const userMsg: AiChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text || 'Please analyze the attached study material.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: draftAtts.map((a) => ({ fileName: a.fileName, kind: a.kind })),
    };

    const nextMessages = [...activeConversation.messages, userMsg];
    const autoTitle =
      activeConversation.messages.length === 0 && text
        ? text.slice(0, 42)
        : activeConversation.title;

    updateConversation(convId, (c) => ({
      ...c,
      title: autoTitle,
      messages: nextMessages,
      attachments: [...c.attachments, ...draftAtts],
      updatedAt: new Date().toISOString(),
    }));

    if (textOverride === undefined) setInput('');
    if (draftAtts === toolDraftAttachments && toolDraftAttachments.length > 0) {
      setToolDraftAttachments([]);
    }

    await requestAssistantReply(convId, nextMessages, draftAtts.length > 0 ? draftAtts : activeConversation.attachments);
  };

  const requestAssistantReply = async (
    convId: string,
    messageList: AiChatMessage[],
    atts = activeConversation.attachments
  ) => {
    setErrorMsg(null);
    setIsGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { reply } = await sendAiChatMessage({
        messages: messageList.map((m) => ({ role: m.role, content: m.content })),
        language: preferences.language,
        learningLevel: preferences.learningLevel,
        responseStyle: preferences.responseStyle,
        studentContext: `${profile.name}, ${profile.course}, ${profile.semester}, ${profile.college}`,
        attachments: atts,
        signal: controller.signal,
      });

      const assistantMsg: AiChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUps: [
          'Explain this more simply',
          'Give me a worked exam example',
          'Create 3 quick revision bullets',
        ],
      };

      updateConversation(convId, (c) => ({
        ...c,
        messages: [...messageList, assistantMsg],
        updatedAt: new Date().toISOString(),
      }));

      addHistoryEntry({
        category: 'Conversations',
        toolId: 'chat',
        title: messageList[0]?.content.slice(0, 50) || 'AI Study Conversation',
        subtitle: `${messageList.length + 1} messages · ${preferences.responseStyle}`,
        payload: { conversationId: convId },
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setErrorMsg('Generation stopped by user.');
      } else {
        setErrorMsg(err?.message || 'Failed to contact KAMPUS AI service.');
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleRegenerate = () => {
    const msgs = [...activeConversation.messages];
    if (msgs.length === 0 || isGenerating) return;
    const withoutLastAssistant =
      msgs[msgs.length - 1].role === 'assistant' ? msgs.slice(0, -1) : msgs;
    if (withoutLastAssistant.length === 0) return;

    updateConversation(activeConversation.id, (c) => ({
      ...c,
      messages: withoutLastAssistant,
    }));
    requestAssistantReply(activeConversation.id, withoutLastAssistant);
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);
    try {
      const att = await uploadAndExtractDocument(file);
      setToolDraftAttachments([...toolDraftAttachments, att]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSaveConversation = () => {
    if (activeConversation.messages.length === 0) return;
    saveItem({
      collection: 'Conversations',
      title: activeConversation.title,
      summary: `${activeConversation.messages.length} messages · ${preferences.responseStyle}`,
      toolId: 'chat',
      data: activeConversation,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: Conversation Sessions & Search */}
      <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3 h-fit">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Conversations ({conversations.length})
          </h3>
          <button
            onClick={() => createNewConversation()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
            placeholder="Search previous conversations..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>

        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredConversations.map((c) => {
            const active = c.id === activeConversation.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveConversationId(c.id)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  {renamingId === c.id ? (
                    <input
                      type="text"
                      value={renameText}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenameText(e.target.value)}
                      onBlur={() => {
                        renameConversation(c.id, renameText);
                        setRenamingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameConversation(c.id, renameText);
                          setRenamingId(null);
                        }
                      }}
                      className="w-full px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-blue-500 text-xs"
                    />
                  ) : (
                    <>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        {c.messages.length} messages
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(c.id);
                      setRenameText(c.title);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Rename conversation"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Conversational Chat Canvas */}
      <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col min-h-[580px] max-h-[78vh]">
        {/* Chat Controls Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                {activeConversation.title}
              </h3>
              <p className="text-[11px] text-slate-400">
                Context-aware multi-turn chat · {profile.course}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSaveConversation}
                disabled={activeConversation.messages.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-400 disabled:opacity-40 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-orange-500" />
                <span>{savedNotice ? 'Saved' : 'Save'}</span>
              </button>
              <button
                onClick={clearActiveConversation}
                disabled={activeConversation.messages.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Response Style, Language, Level Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={preferences.responseStyle}
              onChange={(e) =>
                updatePreferences({ responseStyle: e.target.value as AiResponseStyle })
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              aria-label="Response Style"
            >
              {STYLES.map((st) => (
                <option key={st} value={st}>
                  Style: {st}
                </option>
              ))}
            </select>

            <select
              value={preferences.learningLevel}
              onChange={(e) =>
                updatePreferences({ learningLevel: e.target.value as AiLearningLevel })
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              aria-label="Learning Level"
            >
              {(['Beginner', 'Intermediate', 'Advanced'] as AiLearningLevel[]).map((lvl) => (
                <option key={lvl} value={lvl}>
                  Level: {lvl}
                </option>
              ))}
            </select>

            <select
              value={preferences.language}
              onChange={(e) =>
                updatePreferences({ language: e.target.value as AiLanguage })
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              aria-label="Language"
            >
              {(['English', 'Hindi', 'Hinglish'] as AiLanguage[]).map((lang) => (
                <option key={lang} value={lang}>
                  Language: {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <AiStatusBanner
            compact={!errorMsg}
            errorOverride={errorMsg}
            onRetry={() => {
              if (activeConversation.messages.length > 0) {
                requestAssistantReply(activeConversation.id, activeConversation.messages);
              }
            }}
          />

          {activeConversation.messages.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Start a conversation with KAMPUS AI
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ask conceptual questions, paste code or equations, attach a PDF/DOCX/image, and switch between Simple, Exam-Oriented, or Revision styles.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[
                  'Explain Dijkstra vs Bellman-Ford with time complexity table',
                  'Derive Gauss Law for an infinite charged cylinder',
                  'Help me revise DBMS BCNF vs 3NF for exams',
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => executeSend(sample)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeConversation.messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === 'assistant' && idx === activeConversation.messages.length - 1;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {msg.attachments.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-[11px] font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            {a.fileName}
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.role === 'user' ? (
                      <div className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}

                    <div
                      className={`flex items-center justify-between gap-4 mt-2.5 pt-2 border-t text-[10px] ${
                        msg.role === 'user'
                          ? 'border-white/20 text-blue-100'
                          : 'border-slate-200/70 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          {isLastAssistant && !isGenerating && (
                            <button
                              onClick={handleRegenerate}
                              className="inline-flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Regenerate</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isLastAssistant && msg.followUps && !isGenerating && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.followUps.map((f) => (
                        <button
                          key={f}
                          onClick={() => executeSend(f)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 cursor-pointer"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isGenerating && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Generating {preferences.responseStyle.toLowerCase()}...</span>
              </div>
              <button
                onClick={handleStop}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Composer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {toolDraftAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {toolDraftAttachments.map((att) => (
                <span
                  key={att.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs"
                >
                  <FileText className="w-3 h-3" />
                  <span>{att.fileName}</span>
                  <button
                    onClick={() =>
                      setToolDraftAttachments(
                        toolDraftAttachments.filter((x) => x.id !== att.id)
                      )
                    }
                    className="cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp"
              onChange={handleFileAttach}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || isGenerating}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
              title="Attach PDF, DOCX, PPTX, TXT or Image"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question or paste a problem..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:border-blue-600"
            />

            <button
              type="submit"
              disabled={isGenerating || (!input.trim() && toolDraftAttachments.length === 0)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
