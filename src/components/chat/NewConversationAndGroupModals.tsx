import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  Check,
  Flag,
  MessageSquarePlus,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { GROUP_CATEGORIES, resolveChatAvatar } from '../../data/chatData';
import { GroupCategory, PublicChatStudent } from '../../types/chat';

/* ----------------------------------------------------------
   1. NEW MESSAGE SCREEN / MODAL
---------------------------------------------------------- */
interface NewMessageViewProps {
  onBack: () => void;
  onOpenedConversation: (convId: string) => void;
}

export const NewMessageView: React.FC<NewMessageViewProps> = ({
  onBack,
  onOpenedConversation,
}) => {
  const { students, blockedUserIds, startDirectChat, sendMessageRequest, showToast } = useChat();
  const [query, setQuery] = useState('');
  const [profilePreview, setProfilePreview] = useState<PublicChatStudent | null>(null);
  const [requestTarget, setRequestTarget] = useState<PublicChatStudent | null>(null);
  const [requestText, setRequestText] = useState('');
  const [reqErr, setReqErr] = useState<string | null>(null);

  const visibleStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => !blockedUserIds.includes(s.id))
      .filter((s) =>
        !q ? true : s.name.toLowerCase().includes(q) || s.course.toLowerCase().includes(q)
      );
  }, [students, blockedUserIds, query]);

  const sections: Array<PublicChatStudent['relationship']> = [
    'Study Partner',
    'Recent Contact',
    'Following',
    'Group Member',
    'Suggested',
  ];

  const sectionLabel: Record<PublicChatStudent['relationship'], string> = {
    'Study Partner': 'Study Partners',
    'Recent Contact': 'Recent Contacts',
    Following: 'Following',
    'Group Member': 'Group Members',
    Suggested: 'Suggested Connections',
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTarget || !requestText.trim()) return;
    setReqErr(null);
    const res = await sendMessageRequest(requestTarget.id, requestText);
    if (!res.ok) {
      setReqErr(res.error || 'Unable to send request.');
    } else {
      setRequestTarget(null);
      setRequestText('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">New Message</h2>
      </div>

      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students by name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {sections.map((rel) => {
          const list = visibleStudents.filter((s) => s.relationship === rel);
          if (list.length === 0) return null;
          return (
            <div key={rel} className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {sectionLabel[rel]}
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.map((stu) => (
                  <div key={stu.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={resolveChatAvatar(stu.avatarKey)}
                        alt={stu.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {stu.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {stu.course} · {stu.relationship}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setProfilePreview(stu)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Profile
                      </button>
                      {stu.allowMessagesFrom === 'everyone' || stu.relationship === 'Study Partner' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const cid = await startDirectChat({
                              id: stu.id,
                              name: stu.name,
                              avatarKey: stu.avatarKey,
                            });
                            if (cid) onOpenedConversation(cid);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" /> Start Chat
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestTarget(stu);
                            setReqErr(null);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Public Profile Quick Sheet */}
      {profilePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">PUBLIC STUDENT PROFILE</span>
              <button
                type="button"
                onClick={() => setProfilePreview(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={resolveChatAvatar(profilePreview.avatarKey)}
                alt={profilePreview.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {profilePreview.name}
                </p>
                <p className="text-xs text-slate-500">
                  {profilePreview.course} · {profilePreview.semester}
                </p>
                <p className="text-xs text-slate-400">{profilePreview.college}</p>
              </div>
            </div>
            {profilePreview.sharedInterests.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Interests: {profilePreview.sharedInterests.join(' · ')}
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              Private contact details (email and phone) are hidden by student privacy settings.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRequestTarget(profilePreview);
                  setProfilePreview(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Send Request
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (profilePreview.allowMessagesFrom === 'nobody') {
                    showToast('This student does not allow direct chat starts.');
                    return;
                  }
                  const cid = await startDirectChat({ id: profilePreview.id });
                  setProfilePreview(null);
                  if (cid) onOpenedConversation(cid);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Request Modal */}
      {requestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form
            onSubmit={handleSubmitRequest}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Send Message Request to {requestTarget.name}
              </h3>
              <button
                type="button"
                onClick={() => setRequestTarget(null)}
                className="text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {reqErr && <p className="text-xs text-red-600">{reqErr}</p>}
            <textarea
              rows={3}
              required
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="Introduce yourself and your study topic..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestTarget(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/* ----------------------------------------------------------
   2. CREATE GROUP MODAL
---------------------------------------------------------- */
interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (convId: string) => void;
}

const GROUP_AVATAR_CHOICES = [
  { key: 'collab', label: 'Study Collaboration' },
  { key: 'coding', label: 'Coding & CS Lab' },
  { key: 'exam', label: 'Exam Library' },
  { key: 'books', label: 'Academic Reading' },
  { key: 'campus', label: 'Campus Life' },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { students, createGroup } = useChat();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('Study Group');
  const [avatarKey, setAvatarKey] = useState('collab');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const id = await createGroup({
      title,
      description,
      category,
      avatarKey,
      memberIds: selectedIds,
    });
    if (id) {
      setTitle('');
      setDescription('');
      setSelectedIds([]);
      onClose();
      onCreated(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Group</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CS-401 Distributed Systems Team"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GroupCategory)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {GROUP_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Group Photo
              </label>
              <select
                value={avatarKey}
                onChange={(e) => setAvatarKey(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {GROUP_AVATAR_CHOICES.map((ch) => (
                  <option key={ch.key} value={ch.key}>
                    {ch.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose, syllabus focus, or meeting cadence..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Members ({selectedIds.length} selected)
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2">
              {students.map((stu) => {
                const checked = selectedIds.includes(stu.id);
                return (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => toggleMember(stu.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left cursor-pointer ${
                      checked
                        ? 'bg-blue-50 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={resolveChatAvatar(stu.avatarKey)}
                        alt={stu.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {stu.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{stu.course}</p>
                      </div>
                    </div>
                    {checked && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   3. MESSAGE REQUESTS VIEW
---------------------------------------------------------- */
interface MessageRequestsViewProps {
  onBack: () => void;
  onAccepted: (convId: string) => void;
  onOpenSettings: () => void;
}

export const MessageRequestsView: React.FC<MessageRequestsViewProps> = ({
  onBack,
  onAccepted,
  onOpenSettings,
}) => {
  const {
    currentUserId,
    requests,
    respondToRequest,
    toggleBlockUser,
    submitReport,
  } = useChat();
  const [tab, setTab] = useState<'received' | 'sent'>('received');

  const received = requests.filter((r) => r.toUserId === currentUserId);
  const sent = requests.filter((r) => r.fromUserId === currentUserId);
  const activeList = tab === 'received' ? received : sent;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Message Requests</h2>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          Privacy Controls
        </button>
      </div>

      <div className="px-4 pt-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTab('received')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer ${
            tab === 'received' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          Received ({received.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer ${
            tab === 'sent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeList.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No {tab} message requests.
          </p>
        ) : (
          activeList.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveChatAvatar(req.fromAvatarKey)}
                    alt={req.fromName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {tab === 'received' ? req.fromName : `To ${req.toName}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {req.fromCourse} · {req.status}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-200">{req.messagePreview}</p>

              {req.sharedInterests.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Shared interests: {req.sharedInterests.join(' · ')}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {tab === 'received' && req.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const cid = await respondToRequest(req.id, 'accept');
                        if (cid) onAccepted(cid);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => respondToRequest(req.id, 'decline')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-500 capitalize">
                    Status: {req.status}
                  </span>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => respondToRequest(req.id, 'delete')}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  {tab === 'received' && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleBlockUser(req.fromUserId)}
                        className="inline-flex items-center gap-1 text-red-500 hover:underline cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" /> Block
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          submitReport({
                            targetType: 'request',
                            targetId: req.id,
                            targetSummary: req.messagePreview,
                            reason: 'Spam or unwanted solicitation',
                            details: `Reported request from ${req.fromName}`,
                          })
                        }
                        className="inline-flex items-center gap-1 text-orange-600 hover:underline cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" /> Report
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
