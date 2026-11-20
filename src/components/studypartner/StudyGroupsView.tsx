import React, { useState } from 'react';
import {
  CheckSquare,
  Flag,
  FolderPlus,
  Pencil,
  Plus,
  Radio,
  Send,
  Shield,
  Square,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudyPartner } from '../../context/StudyPartnerContext';
import { GroupVisibility } from '../../types/studyPartner';

type GroupDetailSection =
  | 'overview'
  | 'members'
  | 'discussions'
  | 'sessions'
  | 'resources'
  | 'tasks';

export const StudyGroupsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    createGroup,
    updateGroup,
    deleteGroup,
    invitePartnerToGroup,
    removeGroupMember,
    setGroupMemberRole,
    addGroupDiscussion,
    reportGroupPost,
    addGroupResource,
    addGroupTask,
    toggleGroupTask,
    launchSessionInStudyRoom,
    setActiveTab,
  } = useStudyPartner();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    state.groups[0]?.id || ''
  );
  const [section, setSection] = useState<GroupDetailSection>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create group state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubjects, setNewSubjects] = useState('Algorithms, DBMS');
  const [newGoals, setNewGoals] = useState(
    'Solve 20 PYQ problems weekly, Run Friday mock viva'
  );
  const [newVisibility, setNewVisibility] =
    useState<GroupVisibility>('Course Only');
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([]);

  // Edit group state
  const [editingGroup, setEditingGroup] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sub-section inputs
  const [invitePeerId, setInvitePeerId] = useState('');
  const [postText, setPostText] = useState('');
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<
    'Notes' | 'PYQ Paper' | 'Formula Sheet' | 'Link'
  >('Notes');
  const [resSummary, setResSummary] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const activeGroup =
    state.groups.find((g) => g.id === selectedGroupId) || state.groups[0];

  const isOwner = activeGroup?.ownerId === 'me';
  const myRole = activeGroup?.members.find((m) => m.id === 'me')?.role;
  const canModerate = isOwner || myRole === 'moderator';

  const connectedPeersNotInGroup = activeGroup
    ? state.peers.filter(
        (p) =>
          state.connectedPartnerIds.includes(p.id) &&
          !activeGroup.members.some((m) => m.id === p.id)
      )
    : [];

  const groupSessions = activeGroup
    ? state.sessions.filter(
        (s) => s.targetType === 'group' && s.targetId === activeGroup.id
      )
    : [];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const id = createGroup({
      name: newName,
      description: newDesc || 'Collaborative study group on KAMPUS.',
      subjects: newSubjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      goals: newGoals
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      visibility: newVisibility,
      invitedPartnerIds: selectedInviteIds,
    });
    setSelectedGroupId(id);
    setShowCreateModal(false);
    setNewName('');
    setNewDesc('');
    setSelectedInviteIds([]);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
            Collaborative Study Groups
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize subject circles, assign moderators, share resources, and run group sprints.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateModal ? 'Close Form' : 'Create Study Group'}</span>
        </button>
      </div>

      {/* Create Group Form */}
      {showCreateModal && (
        <form
          onSubmit={handleCreateGroup}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
        >
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            Create New Study Group
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. GATE CS 2027 Evening Problem Solvers"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visibility
              </label>
              <select
                value={newVisibility}
                onChange={(e) =>
                  setNewVisibility(e.target.value as GroupVisibility)
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Public">Public (Campus Discovery)</option>
                <option value="Course Only">Course Only</option>
                <option value="Invite Only">Invite Only (Private)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Purpose, weekly rhythm, and target milestones..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subjects (comma separated)
              </label>
              <input
                type="text"
                value={newSubjects}
                onChange={(e) => setNewSubjects(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Group Goals (comma separated)
              </label>
              <input
                type="text"
                value={newGoals}
                onChange={(e) => setNewGoals(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {state.connectedPartnerIds.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Invite Connected Study Partners
              </label>
              <div className="flex flex-wrap gap-2">
                {state.peers
                  .filter((p) => state.connectedPartnerIds.includes(p.id))
                  .map((p) => {
                    const checked = selectedInviteIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${
                          checked
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedInviteIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== p.id)
                                : [...prev, p.id]
                            )
                          }
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span>{p.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              Create Study Group
            </button>
          </div>
        </form>
      )}

      {/* Groups Split View */}
      {state.groups.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No active study groups
          </h3>
          <p className="text-xs text-slate-500">
            Create a group above and invite connected study partners to start collaborating.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Group List */}
          <div className="lg:col-span-4 space-y-2.5">
            {state.groups.map((grp) => {
              const active = activeGroup?.id === grp.id;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(grp.id);
                    setEditingGroup(false);
                    setConfirmDelete(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    <span>{grp.visibility}</span>
                    <span className="tabular-nums">{grp.members.length} members</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {grp.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {grp.subjects.join(' · ')}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Group Detail Workspace */}
          {activeGroup && (
            <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-5 shadow-2xs">
              {/* Group Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                {editingGroup ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateGroup(activeGroup.id, {
                            name: editName,
                            description: editDesc,
                          });
                          setEditingGroup(false);
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Save Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGroup(false)}
                        className="px-3 py-1 text-xs text-slate-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {activeGroup.visibility} · {activeGroup.members.length} members · Your role:{' '}
                      <span className="capitalize">{myRole || 'member'}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      {activeGroup.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      {activeGroup.description}
                    </p>
                  </div>
                )}

                {canModerate && !editingGroup && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(activeGroup.name);
                        setEditDesc(activeGroup.description);
                        setEditingGroup(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {isOwner &&
                      (confirmDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              deleteGroup(activeGroup.id);
                              setConfirmDelete(false);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="px-2 py-1.5 text-xs text-slate-500 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Group Sub-sections */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800 pb-2">
                {(
                  [
                    ['overview', 'Overview'],
                    ['members', `Members (${activeGroup.members.length})`],
                    ['discussions', `Discussions (${activeGroup.discussions.length})`],
                    ['sessions', `Study Sessions (${groupSessions.length})`],
                    ['resources', `Shared Resources (${activeGroup.resources.length})`],
                    ['tasks', `Group Tasks (${activeGroup.tasks.length})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                      section === id
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* OVERVIEW */}
              {section === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Focus Subjects
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {activeGroup.subjects.join(' · ')}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Group Academic Goals
                      </div>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                        {activeGroup.goals.map((g, idx) => (
                          <li key={idx}>· {g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      launchSessionInStudyRoom({
                        roomName: activeGroup.name,
                        subject: activeGroup.subjects[0] || 'Group Study',
                        objective: activeGroup.goals[0] || activeGroup.description,
                        durationMinutes: 50,
                        invitedPartners: activeGroup.members
                          .filter((m) => m.id !== 'me')
                          .map((m) => m.name),
                      });
                      navigate('/connect/study-rooms');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Launch Collaborative Study Room for Group</span>
                  </button>
                </div>
              )}

              {/* MEMBERS */}
              {section === 'members' && (
                <div className="space-y-4">
                  {canModerate && connectedPeersNotInGroup.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-2">
                      <select
                        value={invitePeerId || connectedPeersNotInGroup[0].id}
                        onChange={(e) => setInvitePeerId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        {connectedPeersNotInGroup.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.course})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          invitePartnerToGroup(
                            activeGroup.id,
                            invitePeerId || connectedPeersNotInGroup[0].id
                          )
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Invite Partner</span>
                      </button>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeGroup.members.map((member) => (
                      <div
                        key={member.id}
                        className="py-3 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {member.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {member.courseLabel} · Role:{' '}
                              <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">
                                {member.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isOwner && member.id !== 'me' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setGroupMemberRole(
                                  activeGroup.id,
                                  member.id,
                                  member.role === 'moderator' ? 'member' : 'moderator'
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              <Shield className="w-3 h-3 text-blue-600" />
                              <span>
                                {member.role === 'moderator'
                                  ? 'Revoke Mod'
                                  : 'Make Moderator'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeGroupMember(activeGroup.id, member.id)
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            >
                              <UserMinus className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DISCUSSIONS */}
              {section === 'discussions' && (
                <div className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addGroupDiscussion(activeGroup.id, postText);
                      setPostText('');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="Share a study update, question, or topic prompt with your group..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!postText.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 disabled:bg-slate-300 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </form>

                  {activeGroup.discussions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      No discussion posts yet. Start the conversation above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeGroup.discussions.map((post) => (
                        <div
                          key={post.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                              <img
                                src={post.authorAvatar}
                                alt={post.authorName}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span>{post.authorName}</span>
                              <span className="font-normal text-slate-400">
                                · {post.dateLabel}
                              </span>
                            </div>
                            {post.authorId !== 'me' && (
                              <button
                                type="button"
                                disabled={post.isReported}
                                onClick={() => reportGroupPost(activeGroup.id, post.id)}
                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Flag className="w-3 h-3" />
                                <span>{post.isReported ? 'Flagged' : 'Report'}</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                            {post.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* GROUP SESSIONS */}
              {section === 'sessions' && (
                <div className="space-y-3">
                  {groupSessions.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                      <p className="text-xs text-slate-500">
                        No sessions scheduled specifically for this group yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('sessions')}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Schedule in Sessions & Goals
                      </button>
                    </div>
                  ) : (
                    groupSessions.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                            {s.status} · {s.dateISO} at {s.timeSlot} ({s.durationMinutes} min)
                          </div>
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {s.title}
                          </div>
                          <p className="text-xs text-slate-500">{s.objectives}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            launchSessionInStudyRoom({
                              roomName: s.title,
                              subject: s.subject,
                              objective: s.objectives,
                              durationMinutes: s.durationMinutes,
                              invitedPartners: activeGroup.members
                                .filter((m) => m.id !== 'me')
                                .map((m) => m.name),
                              sessionId: s.id,
                            });
                            navigate('/connect/study-rooms');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          Open Study Room
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SHARED RESOURCES */}
              {section === 'resources' && (
                <div className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!resTitle.trim()) return;
                      addGroupResource(activeGroup.id, {
                        title: resTitle.trim(),
                        type: resType,
                        noteSummary: resSummary.trim() || 'Shared with study group members',
                      });
                      setResTitle('');
                      setResSummary('');
                    }}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-2"
                  >
                    <input
                      type="text"
                      required
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      placeholder="Resource title (e.g. Unit 4 Normalization PYQ Sheet)"
                      className="sm:col-span-5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <select
                      value={resType}
                      onChange={(e) => setResType(e.target.value as any)}
                      className="sm:col-span-2 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <option>Notes</option>
                      <option>PYQ Paper</option>
                      <option>Formula Sheet</option>
                      <option>Link</option>
                    </select>
                    <input
                      type="text"
                      value={resSummary}
                      onChange={(e) => setResSummary(e.target.value)}
                      placeholder="Short note..."
                      className="sm:col-span-3 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <button
                      type="submit"
                      className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </form>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeGroup.resources.map((res) => (
                      <div key={res.id} className="py-3 space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {res.title}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {res.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{res.noteSummary}</p>
                        <div className="text-[11px] text-slate-400">
                          Added by {res.addedByName} · {res.addedAt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GROUP TASKS */}
              {section === 'tasks' && (
                <div className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addGroupTask(activeGroup.id, taskTitle, taskAssignee);
                      setTaskTitle('');
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Add collaborative group task..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <input
                      type="text"
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      placeholder="Assignee (optional)"
                      className="sm:w-44 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={!taskTitle.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 disabled:bg-slate-300 text-white text-xs font-semibold cursor-pointer"
                    >
                      Add Task
                    </button>
                  </form>

                  <div className="space-y-2">
                    {activeGroup.tasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleGroupTask(activeGroup.id, t.id)}
                        className="w-full p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <span className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                          {t.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <span
                            className={
                              t.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }
                          >
                            {t.title}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {t.assignedTo}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
