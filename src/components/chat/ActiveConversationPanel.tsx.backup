import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BellOff,
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Flag,
  Forward,
  GraduationCap,
  Info,
  Mic,
  MoreVertical,
  Paperclip,
  Pin,
  RefreshCw,
  Reply,
  Search,
  Send,
  Smile,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import {
  formatBytes,
  formatDateSeparator,
  formatMessageTime,
  QUICK_REACTIONS,
} from '../../data/chatData';
import { ChatConversation, ChatMessage, ChatSafetyReport } from '../../types/chat';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { AttachmentCenterModal } from './AttachmentCenterModal';
import { StudyToolsModal } from './StudyToolsModal';
import { KampusAiAssistDrawer } from './KampusAiAssistDrawer';

interface ActiveConversationPanelProps {
  conversation: ChatConversation;
  highlightedMessageId?: string | null;
  infoPanelOpen: boolean;
  onToggleInfoPanel: () => void;
  onMobileBack: () => void;
  onRequestClearConv: (conv: ChatConversation) => void;
  onRequestDeleteConv: (conv: ChatConversation) => void;
  onReportTarget: (target: {
    targetType: ChatSafetyReport['targetType'];
    targetId: string;
    targetSummary: string;
  }) => void;
}

const EMOJI_CHOICES = ['👍', '❤️', '😂', '🎉', '🙏', '🔥', '📚', '💡', '✅', '👏'];

export const ActiveConversationPanel: React.FC<ActiveConversationPanelProps> = ({
  conversation,
  highlightedMessageId,
  infoPanelOpen,
  onToggleInfoPanel,
  onMobileBack,
  onRequestClearConv,
  onRequestDeleteConv,
  onReportTarget,
}) => {
  const navigate = useNavigate();
  const {
    currentUserId,
    conversations,
    messagesByConv,
    hasMoreByConv,
    typingByConv,
    getConversationDisplay,
    getGroupRole,
    loadOlderMessages,
    sendMessage,
    retryFailedMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    togglePinMessage,
    acceptStudySession,
    markConversationRead,
    emitTyping,
    updateConversationAction,
    showToast,
  } = useChat();

  const messages = messagesByConv[conversation.id] || [];
  const hasMore = Boolean(hasMoreByConv[conversation.id]);
  const display = getConversationDisplay(conversation);
  const prefs = conversation.userPrefs[currentUserId];
  const typingPeers = typingByConv[conversation.id] || [];
  const role = getGroupRole(conversation, currentUserId);
  const restrictedMember =
    conversation.type === 'group' &&
    Boolean(conversation.onlyAdminsCanPost) &&
    role !== 'Owner' &&
    role !== 'Admin';

  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  // Conversation inline search
  const [convSearchOpen, setConvSearchOpen] = useState(false);
  const [convSearchQuery, setConvSearchQuery] = useState('');

  // Composer overlays & modals
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [studyToolsOpen, setStudyToolsOpen] = useState(false);
  const [aiDrawerTarget, setAiDrawerTarget] = useState<{
    open: boolean;
    message?: ChatMessage | null;
  }>({ open: false, message: null });
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const [deleteDialogMsg, setDeleteDialogMsg] = useState<ChatMessage | null>(null);

  const feedRef = useRef<HTMLDivElement | null>(null);
  const lastConvIdRef = useRef<string | null>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const typingTimerRef = useRef<number | null>(null);

  // Mark conversation read when opened or receiving new incoming messages
  useEffect(() => {
    markConversationRead(conversation.id);
  }, [conversation.id, messages.length, markConversationRead]);

  // Auto-scroll strictly within feed container so outer page never jumps
  useEffect(() => {
    if (highlightedMessageId && msgRefs.current[highlightedMessageId]) {
      msgRefs.current[highlightedMessageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const feed = feedRef.current;
    if (!feed) return;
    const isSameConv = lastConvIdRef.current === conversation.id;
    lastConvIdRef.current = conversation.id;
    feed.scrollTo({
      top: feed.scrollHeight,
      behavior: isSameConv ? 'smooth' : 'auto',
    });
  }, [conversation.id, messages.length, highlightedMessageId]);

  const firstUnreadMsgId = useMemo(() => {
    const found = messages.find(
      (m) => m.senderId !== currentUserId && m.senderId !== 'system' && !m.readByIds.includes(currentUserId)
    );
    return found?.id;
  }, [messages, currentUserId]);

  const searchMatches = useMemo(() => {
    const q = convSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages.filter((m) =>
      `${m.text} ${m.attachment?.fileName || ''}`.toLowerCase().includes(q)
    );
  }, [convSearchQuery, messages]);

  const handleTypingChange = (val: string) => {
    setInputText(val);
    emitTyping(conversation.id, val.trim().length > 0);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      emitTyping(conversation.id, false);
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;
    emitTyping(conversation.id, false);

    if (editingMsg) {
      await editMessage(editingMsg.id, clean);
      setEditingMsg(null);
      setInputText('');
      return;
    }

    setInputText('');
    const ok = await sendMessage({
      conversationId: conversation.id,
      kind: 'text',
      text: clean,
      replyToId: replyTo?.id,
    });
    if (ok) setReplyTo(null);
  };

  const openSessionInStudyRooms = (msg: ChatMessage) => {
    if (!msg.studySession) return;
    localStorage.setItem(
      'kampus_study_room_handoff_v1',
      JSON.stringify({
        sessionId: msg.studySession.sessionId,
        roomName: msg.studySession.title,
        subject: msg.studySession.subject,
        durationMinutes: msg.studySession.durationMinutes,
        objective: msg.studySession.objective,
        invitedPartners: [display.title],
      })
    );
    navigate('/connect/study-rooms');
  };

  let lastDateLabel = '';

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] dark:bg-slate-950 min-w-0">
      {/* Chat Header */}
      <header className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMobileBack}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleInfoPanel}
            className="flex items-center gap-3 text-left min-w-0 cursor-pointer"
          >
            <div className="relative shrink-0">
              <img
                src={display.avatarUrl}
                alt={display.title}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              {display.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {display.title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {typingPeers.length > 0 ? (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {typingPeers.map((t) => t.userName.split(' ')[0]).join(', ')} typing...
                  </span>
                ) : display.isOnline ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                ) : display.lastSeen ? (
                  `Last seen ${formatMessageTime(display.lastSeen)}`
                ) : (
                  display.subtitle
                )}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            type="button"
            onClick={() => setConvSearchOpen((v) => !v)}
            className={`p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
              convSearchOpen ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600' : ''
            }`}
            title="Search in conversation"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setAiDrawerTarget({ open: true, message: null })}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="KAMPUS AI Chat Assistance"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleInfoPanel}
            className={`p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
              infoPanelOpen ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600' : ''
            }`}
            title="Conversation info & shared files"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setHeaderMenuOpen((v) => !v)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {headerMenuOpen && (
            <div
              onMouseLeave={() => setHeaderMenuOpen(false)}
              className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1.5 text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setHeaderMenuOpen(false);
                  updateConversationAction(conversation.id, {
                    action: 'pin',
                    value: !prefs?.pinned,
                  });
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5" /> {prefs?.pinned ? 'Unpin chat' : 'Pin chat'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setHeaderMenuOpen(false);
                  updateConversationAction(conversation.id, {
                    action: 'mute',
                    value: !prefs?.muted,
                  });
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <BellOff className="w-3.5 h-3.5" /> {prefs?.muted ? 'Unmute alerts' : 'Mute alerts'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setHeaderMenuOpen(false);
                  onRequestClearConv(conversation);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear local history
              </button>
              <button
                type="button"
                onClick={() => {
                  setHeaderMenuOpen(false);
                  onRequestDeleteConv(conversation);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete conversation
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Inline Conversation Search Bar */}
      {convSearchOpen && (
        <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={convSearchQuery}
              onChange={(e) => setConvSearchQuery(e.target.value)}
              placeholder="Search messages in this conversation..."
              className="flex-1 text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 tabular-nums">
              {convSearchQuery.trim() ? `${searchMatches.length} matches` : ''}
            </span>
            <button
              type="button"
              onClick={() => {
                setConvSearchOpen(false);
                setConvSearchQuery('');
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {convSearchQuery.trim() && searchMatches.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {searchMatches.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    msgRefs.current[m.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200 whitespace-nowrap cursor-pointer"
                >
                  {m.senderName.split(' ')[0]}: {m.text.slice(0, 28)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-8 space-y-3">
        {hasMore && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => loadOlderMessages(conversation.id)}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 cursor-pointer"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="py-16 text-center space-y-1.5">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Start chatting with {display.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send a message, voice note, study session invite, or shared notes below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const dateLabel = formatDateSeparator(msg.createdAt);
            const showDateSep = dateLabel !== lastDateLabel;
            lastDateLabel = dateLabel;

            const isOutgoing = msg.senderId === currentUserId;
            const isSystem = msg.kind === 'system';
            const showUnreadSep = msg.id === firstUnreadMsgId;
            const isHighlighted = msg.id === highlightedMessageId;

            if (isSystem) {
              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="text-center py-1">
                      <span className="text-[11px] font-medium text-slate-400">{dateLabel}</span>
                    </div>
                  )}
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 py-1">
                    {msg.text}
                  </div>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={msg.id}>
                {showDateSep && (
                  <div className="text-center py-1.5">
                    <span className="px-3 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {dateLabel}
                    </span>
                  </div>
                )}

                {showUnreadSep && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-orange-300 dark:bg-orange-700" />
                    <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                      Unread messages
                    </span>
                    <div className="h-px flex-1 bg-orange-300 dark:bg-orange-700" />
                  </div>
                )}

                <div
                  ref={(el) => {
                    msgRefs.current[msg.id] = el;
                  }}
                  className={`group flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} ${
                    isHighlighted ? 'ring-2 ring-orange-400 rounded-xl p-1' : ''
                  }`}
                >
                  {conversation.type === 'group' && !isOutgoing && (
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5 ml-1">
                      {msg.senderName}
                    </span>
                  )}

                  <div className={`flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%] ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-2xs ${
                        isOutgoing
                          ? 'bg-[#2563EB] text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {/* Forwarded / Announcement / Pinned label */}
                      {msg.forwardedFrom && (
                        <p className={`text-[10px] italic mb-1 ${isOutgoing ? 'text-blue-100' : 'text-slate-400'}`}>
                          Forwarded from {msg.forwardedFrom}
                        </p>
                      )}
                      {msg.isAnnouncement && (
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isOutgoing ? 'text-orange-200' : 'text-orange-500'}`}>
                          Announcement
                        </p>
                      )}

                      {/* Reply Preview */}
                      {msg.replyPreview && (
                        <div
                          className={`mb-2 px-2.5 py-1.5 rounded-lg text-xs border-l-2 ${
                            isOutgoing
                              ? 'bg-white/15 border-white/60 text-blue-50'
                              : 'bg-slate-50 dark:bg-slate-800 border-blue-500 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <p className="font-semibold text-[11px]">{msg.replyPreview.senderName}</p>
                          <p className="truncate">{msg.replyPreview.text}</p>
                        </div>
                      )}

                      {/* Message Body by Kind */}
                      {msg.deletedForAll ? (
                        <p className="italic opacity-75 text-xs">{msg.text}</p>
                      ) : (
                        <>
                          {msg.kind === 'image' && msg.attachment && (
                            <a
                              href={`${msg.attachment.url}?userId=${encodeURIComponent(currentUserId)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block mb-2 overflow-hidden rounded-xl"
                            >
                              <img
                                src={`${msg.attachment.url}?userId=${encodeURIComponent(currentUserId)}`}
                                alt={msg.attachment.fileName}
                                className="max-h-60 rounded-xl object-cover"
                              />
                            </a>
                          )}

                          {msg.kind === 'document' && msg.attachment && (
                            <a
                              href={`${msg.attachment.url}?userId=${encodeURIComponent(currentUserId)}`}
                              download={msg.attachment.fileName}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl mb-1.5 ${
                                isOutgoing ? 'bg-white/15 text-white' : 'bg-slate-50 dark:bg-slate-800'
                              }`}
                            >
                              <FileText className="w-5 h-5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate">{msg.attachment.fileName}</p>
                                <p className="text-[10px] opacity-80 tabular-nums">
                                  {formatBytes(msg.attachment.sizeBytes)}
                                </p>
                              </div>
                            </a>
                          )}

                          {msg.kind === 'voice' && msg.attachment && (
                            <VoiceMessagePlayer
                              src={`${msg.attachment.url}?userId=${encodeURIComponent(currentUserId)}`}
                              durationSec={msg.attachment.durationSec}
                              waveformPeaks={msg.attachment.waveformPeaks}
                              isOutgoing={isOutgoing}
                            />
                          )}

                          {msg.kind === 'link' && msg.linkUrl && (
                            <a
                              href={msg.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1.5 underline font-medium text-xs ${
                                isOutgoing ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {msg.linkTitle || msg.linkUrl} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {msg.kind === 'study-session' && msg.studySession && (
                            <div
                              className={`rounded-xl p-3 space-y-2 text-xs ${
                                isOutgoing ? 'bg-white/15' : 'bg-slate-50 dark:bg-slate-800/80'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{msg.studySession.title}</span>
                              </div>
                              <p className="opacity-90">
                                {msg.studySession.subject} · {msg.studySession.date} · {msg.studySession.time} ({msg.studySession.durationMinutes} min)
                              </p>
                              <p className="opacity-85">{msg.studySession.objective}</p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => acceptStudySession(msg.id)}
                                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                                    msg.studySession.acceptedByIds.includes(currentUserId)
                                      ? 'bg-emerald-500 text-white'
                                      : isOutgoing
                                        ? 'bg-white text-blue-700'
                                        : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  {msg.studySession.acceptedByIds.includes(currentUserId)
                                    ? `Accepted (${msg.studySession.acceptedByIds.length})`
                                    : 'Accept Invitation'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSessionInStudyRooms(msg)}
                                  className={`px-2.5 py-1 rounded-lg font-semibold border cursor-pointer ${
                                    isOutgoing
                                      ? 'border-white/40 text-white'
                                      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  Open in Study Rooms
                                </button>
                              </div>
                            </div>
                          )}

                          {msg.kind === 'study-resource' && msg.studyResource && (
                            <div
                              className={`rounded-xl p-3 space-y-1.5 text-xs ${
                                isOutgoing ? 'bg-white/15' : 'bg-slate-50 dark:bg-slate-800/80'
                              }`}
                            >
                              <p className="font-semibold opacity-80">
                                {msg.studyResource.sourceModule} · {msg.studyResource.resourceType}
                              </p>
                              <p className="font-bold text-sm">{msg.studyResource.title}</p>
                              <p className="opacity-85">{msg.studyResource.summary}</p>
                              <button
                                type="button"
                                onClick={() => navigate(msg.studyResource!.route)}
                                className={`inline-flex items-center gap-1 font-semibold underline pt-1 cursor-pointer ${
                                  isOutgoing ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                <BookOpen className="w-3.5 h-3.5" /> Open in {msg.studyResource.sourceModule}
                              </button>
                            </div>
                          )}

                          {msg.kind === 'study-goal' && msg.studyGoal && (
                            <div
                              className={`rounded-xl p-3 space-y-1.5 text-xs ${
                                isOutgoing ? 'bg-white/15' : 'bg-slate-50 dark:bg-slate-800/80'
                              }`}
                            >
                              <p className="font-bold">
                                {msg.studyGoal.goalType}: {msg.studyGoal.title}
                              </p>
                              <ul className="space-y-1">
                                {msg.studyGoal.items.map((it) => (
                                  <li key={it.id} className="flex items-center gap-1.5">
                                    <Check className="w-3 h-3 shrink-0" />
                                    <span>{it.label}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.kind === 'text' && (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                          )}
                        </>
                      )}

                      {/* Timestamp + Delivery / Read Receipt */}
                      <div
                        className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] tabular-nums ${
                          isOutgoing ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {msg.isPinned && <Pin className="w-2.5 h-2.5" />}
                        {msg.editedAt && <span>edited</span>}
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isOutgoing && (
                          msg.status === 'failed' ? (
                            <button
                              type="button"
                              onClick={() => msg.clientMsgId && retryFailedMessage(conversation.id, msg.clientMsgId)}
                              className="inline-flex items-center gap-0.5 text-amber-200 font-bold underline cursor-pointer"
                            >
                              <AlertCircle className="w-3 h-3" /> Retry
                            </button>
                          ) : msg.status === 'sending' ? (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          ) : msg.status === 'read' || msg.readByIds.length > 1 ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )
                        )}
                      </div>
                    </div>

                    {/* Hover Contextual Action Menu */}
                    {!msg.deletedForAll && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMsgMenuId((prev) => (prev === msg.id ? null : msg.id))
                          }
                          className="p-1 rounded-lg text-slate-400 opacity-60 sm:opacity-0 group-hover:opacity-100 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                          aria-label="Message actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMsgMenuId === msg.id && (
                          <div
                            onMouseLeave={() => setActiveMsgMenuId(null)}
                            className={`absolute bottom-7 z-30 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1.5 text-xs ${
                              isOutgoing ? 'right-0' : 'left-0'
                            }`}
                          >
                            {/* Quick React Strip */}
                            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              {QUICK_REACTIONS.map((em) => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => {
                                    setActiveMsgMenuId(null);
                                    toggleReaction(msg.id, em);
                                  }}
                                  className="hover:scale-125 transition-transform cursor-pointer"
                                >
                                  {em}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMsgMenuId(null);
                                setReplyTo(msg);
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Reply className="w-3.5 h-3.5" /> Reply
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMsgMenuId(null);
                                navigator.clipboard?.writeText(msg.text).catch(() => {});
                                showToast('Message copied.');
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMsgMenuId(null);
                                setForwardMessage(msg);
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Forward className="w-3.5 h-3.5" /> Forward
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMsgMenuId(null);
                                togglePinMessage(msg.id);
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Pin className="w-3.5 h-3.5" /> {msg.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMsgMenuId(null);
                                setAiDrawerTarget({ open: true, message: msg });
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Explain with AI
                            </button>
                            {isOutgoing && msg.kind === 'text' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMsgMenuId(null);
                                  setEditingMsg(msg);
                                  setInputText(msg.text);
                                }}
                                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMsgMenuId(null);
                                setDeleteDialogMsg(msg);
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                            {!isOutgoing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMsgMenuId(null);
                                  onReportTarget({
                                    targetType: 'message',
                                    targetId: msg.id,
                                    targetSummary: msg.text,
                                  });
                                }}
                                className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Flag className="w-3.5 h-3.5" /> Report
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1 px-1">
                      {msg.reactions.map((r) => {
                        const reacted = r.userIds.includes(currentUserId);
                        return (
                          <button
                            key={r.emoji}
                            type="button"
                            onClick={() => toggleReaction(msg.id, r.emoji)}
                            className={`px-1.5 py-0.5 rounded-full text-[11px] border tabular-nums cursor-pointer ${
                              reacted
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {r.emoji} {r.userIds.length}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Voice Recording Bar */}
      {voiceOpen && (
        <VoiceRecorderBar
          conversationId={conversation.id}
          onClose={() => setVoiceOpen(false)}
          onSent={() => setVoiceOpen(false)}
        />
      )}

      {/* Reply / Edit Banner */}
      {(replyTo || editingMsg) && (
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="min-w-0">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {editingMsg ? 'Editing message' : `Replying to ${replyTo?.senderName}`}
            </span>
            <p className="text-slate-500 truncate">{editingMsg ? editingMsg.text : replyTo?.text}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setReplyTo(null);
              setEditingMsg(null);
              if (editingMsg) setInputText('');
            }}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fixed Bottom Composer */}
      {restrictedMember ? (
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 shrink-0">
          Only group owners and admins can send messages in this group.
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="relative px-3 sm:px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          {emojiOpen && (
            <div className="absolute bottom-14 left-4 z-30 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2 flex gap-1.5">
              {EMOJI_CHOICES.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => `${prev}${em}`);
                    setEmojiOpen(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setAttachmentModalOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            title="Attachment Center"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setStudyToolsOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-orange-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            title="Share Study Session, Resource, or Goals"
          >
            <GraduationCap className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            className="hidden sm:inline-flex p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            title="Insert emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => handleTypingChange(e.target.value)}
            placeholder={`Message ${display.title}...`}
            className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="button"
            onClick={() => setVoiceOpen((v) => !v)}
            className={`p-2 rounded-xl cursor-pointer shrink-0 ${
              voiceOpen
                ? 'bg-red-50 text-red-600 dark:bg-red-950/40'
                : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Voice message"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-40 cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Sub-Modals */}
      <AttachmentCenterModal
        isOpen={attachmentModalOpen}
        conversationId={conversation.id}
        onClose={() => setAttachmentModalOpen(false)}
      />
      <StudyToolsModal
        isOpen={studyToolsOpen}
        conversationId={conversation.id}
        onClose={() => setStudyToolsOpen(false)}
      />
      <KampusAiAssistDrawer
        isOpen={aiDrawerTarget.open}
        conversationId={conversation.id}
        targetMessage={aiDrawerTarget.message}
        onClose={() => setAiDrawerTarget({ open: false, message: null })}
      />

      {/* Forward Message Modal */}
      {forwardMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Forward Message</h3>
              <button
                type="button"
                onClick={() => setForwardMessage(null)}
                className="text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {conversations
                .filter((c) => c.id !== conversation.id)
                .map((target) => {
                  const targetDisp = getConversationDisplay(target);
                  return (
                    <button
                      key={target.id}
                      type="button"
                      onClick={async () => {
                        await sendMessage({
                          conversationId: target.id,
                          kind: 'text',
                          text: forwardMessage.text,
                          forwardedFrom: forwardMessage.senderName,
                        });
                        setForwardMessage(null);
                        showToast(`Forwarded to ${targetDisp.title}`);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <img
                        src={targetDisp.avatarUrl}
                        alt={targetDisp.title}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{targetDisp.title}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Scope Confirmation */}
      {deleteDialogMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Message</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Deleting for yourself removes it only from your local conversation view. Deleting for everyone removes its content from the server for all participants.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await deleteMessage(deleteDialogMsg.id, 'me');
                  setDeleteDialogMsg(null);
                }}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Delete for me (local view only)
              </button>
              {deleteDialogMsg.senderId === currentUserId && (
                <button
                  type="button"
                  onClick={async () => {
                    await deleteMessage(deleteDialogMsg.id, 'everyone');
                    setDeleteDialogMsg(null);
                  }}
                  className="w-full py-2 rounded-xl bg-red-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Delete for everyone
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteDialogMsg(null)}
                className="w-full py-1.5 text-xs text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
