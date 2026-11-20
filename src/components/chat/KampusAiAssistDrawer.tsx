import React, { useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatMessage } from '../../types/chat';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';

interface KampusAiAssistDrawerProps {
  isOpen: boolean;
  conversationId: string;
  targetMessage?: ChatMessage | null;
  onClose: () => void;
}

export const KampusAiAssistDrawer: React.FC<KampusAiAssistDrawerProps> = ({
  isOpen,
  conversationId,
  targetMessage,
  onClose,
}) => {
  const { messagesByConv, askKampusAi, sendMessage } = useChat();
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const recentMessages = (messagesByConv[conversationId] || []).slice(-15);
  const convTranscript = recentMessages
    .map((m) => `${m.senderName}: ${m.text}${m.studyResource ? ` (${m.studyResource.title} - ${m.studyResource.summary})` : ''}`)
    .join('\n');

  const runAction = async (
    mode: 'summarize-conv' | 'explain-msg' | 'quiz-notes' | 'summarize-doc' | 'revision-points'
  ) => {
    setLoadingMode(mode);
    setAiError(null);
    const context =
      targetMessage && (mode === 'explain-msg' || mode === 'summarize-doc' || mode === 'quiz-notes')
        ? `${targetMessage.text}\n${targetMessage.studyResource?.summary || ''}`
        : convTranscript || 'No messages yet in this conversation.';
    const res = await askKampusAi(mode, context);
    setLoadingMode(null);
    if (res.error) setAiError(res.error);
    else setPreviewText(res.text);
  };

  const handleSendToChat = async () => {
    if (!previewText?.trim()) return;
    await sendMessage({
      conversationId,
      kind: 'text',
      text: `KAMPUS AI Note:\n${previewText.trim()}`,
    });
    setPreviewText(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              KAMPUS AI Chat Assistance
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {targetMessage && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Selected message:</span>{' '}
              {targetMessage.text}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(loadingMode)}
              onClick={() => runAction('summarize-conv')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              {loadingMode === 'summarize-conv' ? 'Summarizing...' : 'Summarize Discussion'}
            </button>
            <button
              type="button"
              disabled={Boolean(loadingMode)}
              onClick={() => runAction('explain-msg')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              {loadingMode === 'explain-msg' ? 'Explaining...' : 'Explain Academic Message'}
            </button>
            <button
              type="button"
              disabled={Boolean(loadingMode)}
              onClick={() => runAction('summarize-doc')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              {loadingMode === 'summarize-doc' ? 'Summarizing...' : 'Summarize Shared Material'}
            </button>
            <button
              type="button"
              disabled={Boolean(loadingMode)}
              onClick={() => runAction('quiz-notes')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              {loadingMode === 'quiz-notes' ? 'Generating...' : 'Generate Practice Questions'}
            </button>
            <button
              type="button"
              disabled={Boolean(loadingMode)}
              onClick={() => runAction('revision-points')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              {loadingMode === 'revision-points' ? 'Creating...' : 'Create Revision Points'}
            </button>
          </div>

          {aiError && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
              {aiError}
            </div>
          )}

          {previewText && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                AI Draft Preview (not sent until you confirm)
              </p>
              <div className="text-sm text-slate-800 dark:text-slate-100">
                <MarkdownRenderer content={previewText} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewText(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-500 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSendToChat}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Send to Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
