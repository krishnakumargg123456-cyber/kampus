import React, { useMemo, useState } from 'react';
import {
  Ban,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Flag,
  HelpCircle,
  KeyRound,
  Link2,
  Megaphone,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  UserMinus,
  UserX,
  X,
} from 'lucide-react';
import {
  RoomMessage,
  RoomMessageAttachment,
  RoomRole,
  StudyRoom,
  StudyRoomsReport,
} from '../../types/studyRooms';
import { useStudyRooms } from '../../context/StudyRoomsContext';
import {
  ROOM_QUICK_REACTIONS,
  formatShortTime,
  resolveRoomAvatar,
} from '../../data/studyRoomsData';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';

type ReportCallback = (target: {
  roomId: string;
  targetType: StudyRoomsReport['targetType'];
  targetId: string;
  targetSummary: string;
}) => void;

/* ----------------------------------------------------------
   1. ROOM DISCUSSION PANEL
---------------------------------------------------------- */
export const RoomDiscussionPanel: React.FC<{
  room: StudyRoom;
  isHostOrMod: boolean;
  onReport: ReportCallback;
}> = ({ room, isHostOrMod, onReport }) => {
  const {
    currentUserId,
    blockedUserIds,
    uploadRoomFile,
    sendRoomMessage,
    reactRoomMessage,
    pinRoomMessage,
    deleteRoomMessage,
    showToast,
  } = useStudyRooms();

  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<RoomMessage | null>(null);
  const [attachment, setAttachment] = useState<RoomMessageAttachment | undefined>(undefined);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [uploading, setUploading] = useState(false);

  const visibleMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return room.messages.filter((m) => {
      if (blockedUserIds.includes(m.senderId)) return false;
      if (!q) return true;
      return (
        m.text.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)
      );
    });
  }, [room.messages, blockedUserIds, search]);

  const pinnedMessages = useMemo(
    () => room.messages.filter((m) => m.isPinned && !blockedUserIds.includes(m.senderId)),
    [room.messages, blockedUserIds]
  );

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadRoomFile(file, room.id);
      setAttachment(uploaded);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Attachment upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;
    const ok = await sendRoomMessage(room.id, {
      text: text.trim(),
      replyToId: replyTo?.id,
      attachment,
      isAnnouncement: isHostOrMod && isAnnouncement,
    });
    if (ok) {
      setText('');
      setReplyTo(null);
      setAttachment(undefined);
      setIsAnnouncement(false);
    }
  };

  if (!room.enableGroupDiscussion) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        Group discussion is turned off by the host for this Silent Study room.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[460px]">
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room discussion..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs"
          />
        </div>
        {pinnedMessages.length > 0 && (
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Pin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <div className="min-w-0">
              <span className="font-semibold">Pinned: </span>
              <span className="line-clamp-2">{pinnedMessages[pinnedMessages.length - 1].text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[420px]">
        {visibleMessages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No messages yet. Say hello or share a quick update with the room!
          </p>
        ) : (
          visibleMessages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`rounded-2xl p-3 border text-xs space-y-1.5 ${
                  msg.isAnnouncement
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900'
                    : isMine
                      ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {msg.isAnnouncement && <Megaphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {msg.senderRole}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatShortTime(msg.createdAt)}
                  </span>
                </div>

                {msg.replyPreview && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 truncate">
                    Replying to <span className="font-semibold">{msg.replyPreview.senderName}:</span>{' '}
                    {msg.replyPreview.text}
                  </div>
                )}

                {msg.text && (
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>
                )}

                {msg.attachment && (
                  <a
                    href={msg.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    <Paperclip className="w-3 h-3" /> {msg.attachment.fileName}
                  </a>
                )}

                {/* Reactions & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {msg.reactions.map((rx) => {
                      const reacted = rx.userIds.includes(currentUserId);
                      return (
                        <button
                          key={rx.emoji}
                          type="button"
                          onClick={() => reactRoomMessage(room.id, msg.id, rx.emoji)}
                          className={`px-1.5 py-0.5 rounded-md text-[11px] border cursor-pointer ${
                            reacted
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          {rx.emoji} {rx.userIds.length}
                        </button>
                      );
                    })}
                    {ROOM_QUICK_REACTIONS.slice(0, 3).map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => reactRoomMessage(room.id, msg.id, em)}
                        className="text-[11px] opacity-60 hover:opacity-100 px-1 cursor-pointer"
                        title={`React ${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setReplyTo(msg)}
                      title="Reply"
                      className="hover:text-blue-600 cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    {isHostOrMod && (
                      <button
                        type="button"
                        onClick={() => pinRoomMessage(room.id, msg.id)}
                        title={msg.isPinned ? 'Unpin' : 'Pin message'}
                        className={`cursor-pointer ${
                          msg.isPinned ? 'text-amber-500' : 'hover:text-amber-500'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(isMine || isHostOrMod) && (
                      <button
                        type="button"
                        onClick={() => deleteRoomMessage(room.id, msg.id)}
                        title="Delete"
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isMine && (
                      <button
                        type="button"
                        onClick={() =>
                          onReport({
                            roomId: room.id,
                            targetType: 'message',
                            targetId: msg.id,
                            targetSummary: `${msg.senderName}: ${msg.text.slice(0, 80)}`,
                          })
                        }
                        title="Report message"
                        className="hover:text-orange-500 cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="truncate">Replying to {replyTo.senderName}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {attachment && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300">
            <span className="truncate">{attachment.fileName}</span>
            <button type="button" onClick={() => setAttachment(undefined)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 cursor-pointer">
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={handleFileAttach}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={uploading ? 'Uploading attachment...' : 'Message the room...'}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={uploading}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {isHostOrMod && (
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={(e) => setIsAnnouncement(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Highlight as Host Announcement</span>
          </label>
        )}
      </form>
    </div>
  );
};

/* ----------------------------------------------------------
   2. DEDICATED DOUBT SOLVING BOARD PANEL
---------------------------------------------------------- */
export const RoomDoubtBoardPanel: React.FC<{
  room: StudyRoom;
  isHostOrMod: boolean;
  onReport: ReportCallback;
}> = ({ room, isHostOrMod, onReport }) => {
  const { currentUserId, postDoubt, answerDoubt, toggleResolveDoubt, uploadRoomFile, showToast } =
    useStudyRooms();

  const [filter, setFilter] = useState<'all' | 'open'>('all');
  const [showAskForm, setShowAskForm] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState(room.topic);
  const [explanation, setExplanation] = useState('');
  const [attachment, setAttachment] = useState<RoomMessageAttachment | undefined>(undefined);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const doubts = useMemo(
    () =>
      room.doubts.filter((d) => (filter === 'open' ? !d.resolved : true)),
    [room.doubts, filter]
  );

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const uploaded = await uploadRoomFile(file, room.id);
      setAttachment(uploaded);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  const handlePostDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const ok = await postDoubt(room.id, {
      title: title.trim(),
      explanation: explanation.trim(),
      subject: room.subject,
      topic: topic.trim() || room.topic,
      attachment,
    });
    if (ok) {
      setTitle('');
      setExplanation('');
      setAttachment(undefined);
      setShowAskForm(false);
    }
  };

  return (
    <div className="p-3 space-y-3 max-h-[540px] overflow-y-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              filter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white' : 'text-slate-500'
            }`}
          >
            All ({room.doubts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('open')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              filter === 'open' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white' : 'text-slate-500'
            }`}
          >
            Open ({room.doubts.filter((d) => !d.resolved).length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAskForm((p) => !p)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Ask Doubt
        </button>
      </div>

      {showAskForm && (
        <form
          onSubmit={handlePostDoubt}
          className="p-3 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-2.5"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Doubt question title..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
          />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Sub-topic"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
          />
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain where you got stuck..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
          />
          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachment ? attachment.fileName : 'Attach image/PDF'}</span>
              <input type="file" onChange={handleAttach} className="hidden" />
            </label>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              Post Doubt
            </button>
          </div>
        </form>
      )}

      {doubts.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400">
          <HelpCircle className="w-7 h-7 mx-auto mb-2 opacity-40" />
          No doubts posted here yet.
        </div>
      ) : (
        doubts.map((doubt) => (
          <div
            key={doubt.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{doubt.title}</p>
                <p className="text-[11px] text-slate-400">
                  {doubt.topic} · Asked by {doubt.authorName}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                  doubt.resolved
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                }`}
              >
                {doubt.resolved ? 'Resolved' : 'Open'}
              </span>
            </div>

            {doubt.explanation && (
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{doubt.explanation}</p>
            )}

            {doubt.attachment && (
              <a
                href={doubt.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                <Paperclip className="w-3 h-3" /> {doubt.attachment.fileName}
              </a>
            )}

            {/* Answers */}
            {doubt.answers.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {doubt.answers.map((ans) => (
                  <div
                    key={ans.id}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-[11px]"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ans.authorName}:{' '}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{ans.text}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={replyDrafts[doubt.id] || ''}
                onChange={(e) =>
                  setReplyDrafts((prev) => ({ ...prev, [doubt.id]: e.target.value }))
                }
                placeholder="Write a helpful answer..."
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-[11px]"
              />
              <button
                type="button"
                onClick={async () => {
                  const val = (replyDrafts[doubt.id] || '').trim();
                  if (!val) return;
                  await answerDoubt(room.id, doubt.id, val);
                  setReplyDrafts((prev) => ({ ...prev, [doubt.id]: '' }));
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-[11px] font-semibold cursor-pointer"
              >
                Reply
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              {(doubt.authorId === currentUserId || isHostOrMod) && (
                <button
                  type="button"
                  onClick={() => toggleResolveDoubt(room.id, doubt.id)}
                  className="inline-flex items-center gap-1 text-emerald-600 font-semibold cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {doubt.resolved ? 'Reopen Doubt' : 'Mark Resolved'}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onReport({
                    roomId: room.id,
                    targetType: 'doubt',
                    targetId: doubt.id,
                    targetSummary: doubt.title,
                  })
                }
                className="inline-flex items-center gap-1 text-slate-400 hover:text-orange-500 cursor-pointer ml-auto"
              >
                <Flag className="w-3 h-3" /> Report
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/* ----------------------------------------------------------
   3. PARTICIPANTS, PERMISSIONS & INVITE PANEL
---------------------------------------------------------- */
export const RoomParticipantsAndInvitePanel: React.FC<{
  room: StudyRoom;
  isOwner: boolean;
  isHostOrMod: boolean;
  onReport: ReportCallback;
}> = ({ room, isOwner, isHostOrMod, onReport }) => {
  const {
    currentUserId,
    blockedUserIds,
    reviewJoinRequest,
    regenerateInvite,
    revokeInvite,
    updateParticipantRole,
    toggleBlockUser,
    showToast,
  } = useStudyRooms();

  const [copiedKey, setCopiedKey] = useState<'code' | 'link' | null>(null);
  const [expiryHours, setExpiryHours] = useState<number>(24);

  const pendingRequests = room.joinRequests.filter((jr) => jr.status === 'pending');

  const copyText = (val: string, key: 'code' | 'link', label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    showToast(`${label} copied to clipboard.`);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  const inviteLink = `${window.location.origin}/connect/study-rooms?invite=${room.invitation.token}`;

  return (
    <div className="p-3 space-y-4 max-h-[540px] overflow-y-auto text-xs">
      {/* Room Code & Invitation Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>Room Invite & Code</span>
          </div>
          {room.invitation.revoked ? (
            <span className="text-[11px] font-semibold text-red-500">Revoked</span>
          ) : (
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {room.roomCode}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={room.invitation.revoked}
            onClick={() => copyText(room.roomCode, 'code', 'Room code')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer disabled:opacity-40"
          >
            {copiedKey === 'code' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>Copy Code</span>
          </button>
          <button
            type="button"
            disabled={room.invitation.revoked}
            onClick={() => copyText(inviteLink, 'link', 'Invite link')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer disabled:opacity-40"
          >
            {copiedKey === 'link' ? <Check className="w-3 h-3 text-emerald-500" /> : <Link2 className="w-3 h-3" />}
            <span>Copy Invite Link</span>
          </button>
        </div>

        {room.invitation.expiresAt && !room.invitation.revoked && (
          <p className="text-[11px] text-slate-400">
            Expires: {new Date(room.invitation.expiresAt).toLocaleString()}
          </p>
        )}

        {isHostOrMod && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px]"
              >
                <option value={24}>24h expiry</option>
                <option value={72}>72h expiry</option>
                <option value={0}>No expiry</option>
              </select>
              <button
                type="button"
                onClick={() => regenerateInvite(room.id, expiryHours > 0 ? expiryHours : undefined)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>
            {!room.invitation.revoked && (
              <button
                type="button"
                onClick={() => revokeInvite(room.id)}
                className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
              >
                Revoke Link
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pending Join Requests Queue */}
      {isHostOrMod && pendingRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
            <span>Join Requests ({pendingRequests.length})</span>
          </h4>
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="p-3 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/30 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{req.userName}</p>
                  <p className="text-[11px] text-slate-500">{req.userCourse}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => reviewJoinRequest(room.id, req.id, 'accept')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3" /> Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewJoinRequest(room.id, req.id, 'reject')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 cursor-pointer"
                  >
                    <UserX className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
              {req.message && <p className="text-[11px] text-slate-600 dark:text-slate-300">"{req.message}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* Participant Roster */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-white">
            Participants ({room.participants.length}/{room.maxCapacity})
          </h4>
          <span className="text-[11px] text-emerald-600 font-semibold tabular-nums">
            {room.activeParticipantIds.length} active
          </span>
        </div>

        {room.participants.map((p) => {
          const isOnline = room.activeParticipantIds.includes(p.userId);
          const isMe = p.userId === currentUserId;
          const isBlocked = blockedUserIds.includes(p.userId);

          return (
            <div
              key={p.userId}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={resolveRoomAvatar(p.avatarKey)}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {p.name} {isMe && '(You)'}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isOnline
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isOnline ? 'Active' : 'Joined'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {p.role} · {p.course}
                    </p>
                  </div>
                </div>
              </div>

              {/* Host/Mod Controls */}
              {!isMe && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {isHostOrMod && p.role !== 'Owner' ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isOwner && (
                        <select
                          value={p.role}
                          onChange={(e) =>
                            updateParticipantRole(room.id, p.userId, 'setRole', {
                              role: e.target.value as RoomRole,
                            })
                          }
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-1 text-[11px]"
                        >
                          <option value="Co-host">Co-host</option>
                          <option value="Moderator">Moderator</option>
                          <option value="Participant">Participant</option>
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          updateParticipantRole(room.id, p.userId, 'permissions', {
                            canShareResources: !p.canShareResources,
                          })
                        }
                        className={`px-2 py-1 rounded-lg border cursor-pointer ${
                          p.canShareResources
                            ? 'border-blue-200 text-blue-600'
                            : 'border-slate-200 text-slate-400'
                        }`}
                      >
                        {p.canShareResources ? 'Resources On' : 'Resources Off'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateParticipantRole(room.id, p.userId, 'remove')}
                        className="inline-flex items-center gap-0.5 text-red-500 hover:underline cursor-pointer"
                      >
                        <UserMinus className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => toggleBlockUser(p.userId)}
                      className="inline-flex items-center gap-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <Ban className="w-3 h-3" /> {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onReport({
                          roomId: room.id,
                          targetType: 'participant',
                          targetId: p.userId,
                          targetSummary: `${p.name} (${p.role})`,
                        })
                      }
                      className="inline-flex items-center gap-0.5 text-slate-400 hover:text-orange-500 cursor-pointer"
                    >
                      <Flag className="w-3 h-3" /> Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   4. CONTEXTUAL KAMPUS AI STUDY ASSISTANT PANEL
---------------------------------------------------------- */
export const RoomAiAssistPanel: React.FC<{
  room: StudyRoom;
}> = ({ room }) => {
  const { askRoomAi, sendRoomMessage, saveNote, showToast } = useStudyRooms();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastTitle, setLastTitle] = useState('AI Study Brief');
  const [selectedResourceTitle, setSelectedResourceTitle] = useState(
    room.resources[0]?.title || ''
  );

  const actions: Array<{
    id:
      | 'explain-topic'
      | 'practice-questions'
      | 'summarize-notes'
      | 'revision-points'
      | 'discussion-topics'
      | 'session-plan'
      | 'explain-resource';
    label: string;
  }> = [
    { id: 'explain-topic', label: 'Explain Topic' },
    { id: 'practice-questions', label: 'Practice Questions' },
    { id: 'summarize-notes', label: 'Summarize Room Notes' },
    { id: 'revision-points', label: 'Revision Points' },
    { id: 'discussion-topics', label: 'Discussion Prompts' },
    { id: 'session-plan', label: 'Generate Session Plan' },
    { id: 'explain-resource', label: 'Explain Selected Resource' },
  ];

  const runAction = async (id: (typeof actions)[number]['id'], label: string) => {
    setBusyAction(id);
    setErr(null);
    setLastTitle(`${label}: ${room.topic}`);
    const customCtx =
      id === 'explain-resource' && selectedResourceTitle
        ? `Selected resource title: ${selectedResourceTitle}`
        : undefined;
    const res = await askRoomAi(room, id, customCtx);
    setBusyAction(null);
    if (res.error) {
      setErr(res.error);
    } else {
      setOutput(res.text);
    }
  };

  return (
    <div className="p-3 space-y-3 max-h-[540px] overflow-y-auto">
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/70 dark:border-blue-900 p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            KAMPUS AI Study Assistant
          </h4>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300">
          Context-aware support for <span className="font-semibold">{room.subject}</span> ({room.topic}).
        </p>

        {room.resources.length > 0 && (
          <select
            value={selectedResourceTitle}
            onChange={(e) => setSelectedResourceTitle(e.target.value)}
            className="w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px]"
          >
            {room.resources.map((r) => (
              <option key={r.id} value={`${r.title} (${r.kind})`}>
                Resource: {r.title}
              </option>
            ))}
          </select>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {actions.map((act) => (
            <button
              key={act.id}
              type="button"
              disabled={Boolean(busyAction)}
              onClick={() => runAction(act.id, act.label)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>{busyAction === act.id ? 'Generating...' : act.label}</span>
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300">
          {err}
        </div>
      )}

      {output && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-3">
          <div className="text-xs leading-relaxed">
            <MarkdownRenderer content={output} />
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={async () => {
                await sendRoomMessage(room.id, {
                  text: `**[KAMPUS AI · ${lastTitle}]**\n${output}`,
                });
                showToast('Posted AI response to room discussion.');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold cursor-pointer"
            >
              Post to Discussion
            </button>
            <button
              type="button"
              onClick={async () => {
                await saveNote(room.id, 'upsert', {
                  topic: room.topic,
                  title: lastTitle,
                  content: output,
                });
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Save to Shared Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
