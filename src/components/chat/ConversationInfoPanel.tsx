import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  BookOpen,
  ExternalLink,
  FileText,
  Flag,
  Link as LinkIcon,
  Pin,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { formatBytes, formatMessageTime, resolveChatAvatar } from '../../data/chatData';
import { ChatConversation, ChatSafetyReport, GroupRole, RightPanelTab } from '../../types/chat';

interface ConversationInfoPanelProps {
  conversation: ChatConversation;
  isMobile?: boolean;
  onClose: () => void;
  onJumpToMessage?: (msgId: string) => void;
  onReport: (target: {
    targetType: ChatSafetyReport['targetType'];
    targetId: string;
    targetSummary: string;
  }) => void;
}

const INFO_TABS: RightPanelTab[] = [
  'Overview',
  'Members',
  'Media',
  'Documents',
  'Links',
  'Study Resources',
  'Pinned Messages',
];

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  conversation,
  isMobile = false,
  onClose,
  onJumpToMessage,
  onReport,
}) => {
  const navigate = useNavigate();
  const {
    currentUserId,
    messagesByConv,
    students,
    blockedUserIds,
    getConversationDisplay,
    getGroupRole,
    getStudentById,
    updateConversationAction,
    toggleBlockUser,
    togglePinMessage,
  } = useChat();

  const [tab, setTab] = useState<RightPanelTab>('Overview');
  const [editingGroup, setEditingGroup] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || '');
  const [editDesc, setEditDesc] = useState(conversation.description || '');
  const [addMemberId, setAddMemberId] = useState('');

  const display = getConversationDisplay(conversation);
  const msgs = messagesByConv[conversation.id] || [];
  const role = getGroupRole(conversation, currentUserId);
  const isAdmin = role === 'Owner' || role === 'Admin';
  const isOwner = role === 'Owner';

  const mediaMessages = useMemo(
    () => msgs.filter((m) => m.attachment?.kind === 'image' && !m.deletedForAll),
    [msgs]
  );
  const docMessages = useMemo(
    () =>
      msgs.filter(
        (m) =>
          (m.attachment?.kind === 'document' || m.attachment?.kind === 'audio') && !m.deletedForAll
      ),
    [msgs]
  );
  const linkMessages = useMemo(
    () => msgs.filter((m) => Boolean(m.linkUrl) && !m.deletedForAll),
    [msgs]
  );
  const resourceMessages = useMemo(
    () => msgs.filter((m) => Boolean(m.studyResource || m.studySession || m.studyGoal) && !m.deletedForAll),
    [msgs]
  );
  const pinnedMessages = useMemo(
    () => msgs.filter((m) => Boolean(m.isPinned) && !m.deletedForAll),
    [msgs]
  );

  const availableTabs = conversation.type === 'group' ? INFO_TABS : INFO_TABS.filter((t) => t !== 'Members');
  const addableStudents = students.filter((s) => !conversation.participantIds.includes(s.id));

  const peerBlocked = display.peerId ? blockedUserIds.includes(display.peerId) : false;

  const handleSaveGroupInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConversationAction(conversation.id, {
      action: 'editInfo',
      title: editTitle,
      description: editDesc,
    });
    setEditingGroup(false);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {conversation.type === 'group' ? 'Group Info & Library' : 'Contact Info & Library'}
          </h3>
        </div>
        {!isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800">
        {availableTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-2.5 py-2 text-[11px] font-semibold border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
              tab === t
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'Overview' && (
          <>
            <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <img
                src={display.avatarUrl}
                alt={display.title}
                className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {display.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{display.subtitle}</p>
              </div>
              {conversation.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {conversation.description}
                </p>
              )}
            </div>

            {conversation.type === 'group' && isAdmin && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(conversation.title || '');
                    setEditDesc(conversation.description || '');
                    setEditingGroup((v) => !v);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {editingGroup ? 'Cancel Editing' : 'Edit Group Info & Permissions'}
                </button>

                {editingGroup && (
                  <form onSubmit={handleSaveGroupInfo} className="space-y-2.5 pt-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                    />
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                    />
                    <label className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <span>Only admins can send messages</span>
                      <input
                        type="checkbox"
                        checked={Boolean(conversation.onlyAdminsCanPost)}
                        onChange={(e) =>
                          updateConversationAction(conversation.id, {
                            action: 'permissions',
                            onlyAdminsCanPost: e.target.checked,
                          })
                        }
                        className="accent-blue-600"
                      />
                    </label>
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Group Changes
                    </button>
                  </form>
                )}

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => updateConversationAction(conversation.id, { action: 'closeGroup' })}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Group for All
                  </button>
                )}
              </div>
            )}

            {/* Quick Counts */}
            <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="font-bold text-slate-900 dark:text-white">{mediaMessages.length}</p>
                <p className="text-slate-500">Shared media</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="font-bold text-slate-900 dark:text-white">{docMessages.length}</p>
                <p className="text-slate-500">Documents &amp; Audio</p>
              </div>
            </div>

            {/* Safety Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {display.peerId && (
                <button
                  type="button"
                  onClick={() => toggleBlockUser(display.peerId!)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  {peerBlocked ? `Unblock ${display.title}` : `Block ${display.title}`}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onReport({
                    targetType: conversation.type === 'group' ? 'group' : 'user',
                    targetId: display.peerId || conversation.id,
                    targetSummary: display.title,
                  })
                }
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-semibold cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                Report {conversation.type === 'group' ? 'Group' : 'Contact'}
              </button>
            </div>
          </>
        )}

        {tab === 'Members' && conversation.type === 'group' && (
          <div className="space-y-4">
            {isAdmin && addableStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={addMemberId}
                  onChange={(e) => setAddMemberId(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs"
                >
                  <option value="">Add student to group...</option>
                  {addableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!addMemberId}
                  onClick={async () => {
                    if (!addMemberId) return;
                    await updateConversationAction(conversation.id, {
                      action: 'addMember',
                      targetUserId: addMemberId,
                    });
                    setAddMemberId('');
                  }}
                  className="p-2 rounded-xl bg-blue-600 text-white disabled:opacity-40 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(conversation.members || []).map((m) => {
                const stu = getStudentById(m.userId);
                const label = m.userId === currentUserId ? 'You' : stu?.name || m.userId;
                const avatar =
                  m.userId === currentUserId
                    ? resolveChatAvatar('priya')
                    : resolveChatAvatar(stu?.avatarKey);

                return (
                  <div key={m.userId} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={avatar} alt={label} className="w-8 h-8 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {label}
                        </p>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {m.role}
                        </p>
                      </div>
                    </div>

                    {isOwner && m.userId !== currentUserId && (
                      <div className="flex items-center gap-1 text-[11px]">
                        <select
                          value={m.role}
                          onChange={(e) =>
                            updateConversationAction(conversation.id, {
                              action: 'assignRole',
                              targetUserId: m.userId,
                              role: e.target.value as GroupRole,
                            })
                          }
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-1"
                        >
                          <option value="Member">Member</option>
                          <option value="Admin">Admin</option>
                          <option value="Owner">Owner</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            updateConversationAction(conversation.id, {
                              action: 'removeMember',
                              targetUserId: m.userId,
                            })
                          }
                          className="text-red-500 px-1.5 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'Media' &&
          (mediaMessages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No images shared yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {mediaMessages.map((m) => (
                <a
                  key={m.id}
                  href={`${m.attachment!.url}?userId=${encodeURIComponent(currentUserId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square bg-slate-100 dark:bg-slate-800"
                >
                  <img
                    src={`${m.attachment!.url}?userId=${encodeURIComponent(currentUserId)}`}
                    alt={m.attachment!.fileName}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          ))}

        {tab === 'Documents' &&
          (docMessages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No documents or audio files yet.</p>
          ) : (
            <div className="space-y-2">
              {docMessages.map((m) => (
                <a
                  key={m.id}
                  href={`${m.attachment!.url}?userId=${encodeURIComponent(currentUserId)}`}
                  download={m.attachment!.fileName}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-100 truncate">
                      {m.attachment!.fileName}
                    </span>
                  </div>
                  <span className="text-slate-400 shrink-0 tabular-nums">
                    {formatBytes(m.attachment!.sizeBytes)}
                  </span>
                </a>
              ))}
            </div>
          ))}

        {tab === 'Links' &&
          (linkMessages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No links shared yet.</p>
          ) : (
            <div className="space-y-2">
              {linkMessages.map((m) => (
                <a
                  key={m.id}
                  href={m.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-medium text-blue-600 dark:text-blue-400 truncate">
                      {m.linkTitle || m.linkUrl}
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                </a>
              ))}
            </div>
          ))}

        {tab === 'Study Resources' &&
          (resourceMessages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No shared study tools yet.</p>
          ) : (
            <div className="space-y-2.5">
              {resourceMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-white">
                    {m.studyResource?.title || m.studySession?.title || m.studyGoal?.title}
                  </p>
                  <p className="text-slate-500">
                    {m.studyResource
                      ? `${m.studyResource.sourceModule} · ${m.studyResource.subject}`
                      : m.studySession
                        ? `${m.studySession.subject} · ${m.studySession.date} ${m.studySession.time}`
                        : m.studyGoal?.goalType}
                  </p>
                  {m.studyResource?.route && (
                    <button
                      type="button"
                      onClick={() => navigate(m.studyResource!.route)}
                      className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" /> Open in {m.studyResource.sourceModule}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

        {tab === 'Pinned Messages' &&
          (pinnedMessages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No pinned messages in this chat.</p>
          ) : (
            <div className="space-y-2">
              {pinnedMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {m.senderName}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePinMessage(m.id)}
                      className="text-orange-500 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pin className="w-3 h-3" /> Unpin
                    </button>
                  </div>
                  <p
                    onClick={() => onJumpToMessage?.(m.id)}
                    className="text-slate-700 dark:text-slate-200 cursor-pointer hover:text-blue-600"
                  >
                    {m.text}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatMessageTime(m.createdAt)}</p>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};
