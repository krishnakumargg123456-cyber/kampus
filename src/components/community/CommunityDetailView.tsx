import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BellOff,
  Check,
  MessageSquarePlus,
  Pin,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { CommunityDetailTab, CommunityMemberRole, CommunityPost } from '../../types/community';
import { PostFeedCard } from './PostFeedCard';

const DETAIL_TABS: CommunityDetailTab[] = [
  'Overview',
  'Discussions',
  'Questions',
  'Members',
  'Resources',
  'Announcements',
  'Rules',
];

interface CommunityDetailViewProps {
  communityId: string;
  onBack: () => void;
  onOpenComposer: (mode: 'discussion' | 'question', communityId: string) => void;
  onOpenThread: (postId: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onEditPost: (post: CommunityPost) => void;
  onReportPost: (post: CommunityPost) => void;
}

export const CommunityDetailView: React.FC<CommunityDetailViewProps> = ({
  communityId,
  onBack,
  onOpenComposer,
  onOpenThread,
  onOpenStudentProfile,
  onEditPost,
  onReportPost,
}) => {
  const {
    currentStudentId,
    visiblePosts,
    getCommunityById,
    getStudentById,
    getUserRoleInCommunity,
    isMemberOfCommunity,
    isCommunityMuted,
    joinCommunity,
    leaveCommunity,
    toggleMuteCommunity,
    updateCommunityDetails,
    assignCommunityRole,
    removeCommunityMember,
    createPost,
  } = useCommunity();

  const community = getCommunityById(communityId);
  const [activeTab, setActiveTab] = useState<CommunityDetailTab>('Overview');

  // Moderator edit states
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [editDesc, setEditDesc] = useState(community?.description || '');
  const [editRulesText, setEditRulesText] = useState(community?.rules.join('\n') || '');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const commPosts = useMemo(
    () =>
      visiblePosts
        .filter((p) => p.communityId === communityId)
        .sort((a, b) => {
          if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [visiblePosts, communityId]
  );

  if (!community) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Community not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          Back to Explore Communities
        </button>
      </div>
    );
  }

  const joined = isMemberOfCommunity(community.id);
  const role = getUserRoleInCommunity(community.id);
  const isOwner = role === 'Owner';
  const isModerator = role === 'Owner' || role === 'Moderator';
  const muted = isCommunityMuted(community.id);

  const discussions = commPosts.filter((p) => p.type !== 'Ask a Question');
  const questions = commPosts.filter((p) => p.type === 'Ask a Question');
  const resources = commPosts.filter(
    (p) => p.type === 'Share a Resource' || Boolean(p.linkedResourceTitle)
  );
  const announcements = commPosts.filter(
    (p) => p.type === 'Academic Announcement' || p.isOfficialAnnouncement || p.isPinned
  );

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommunityDetails(community.id, {
      description: editDesc.trim() || community.description,
      rules: editRulesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
    });
    setEditInfoOpen(false);
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (annTitle.trim().length < 4 || annBody.trim().length < 6) return;
    createPost({
      communityId: community.id,
      type: 'Academic Announcement',
      title: annTitle,
      content: annBody,
      tags: ['#Announcement'],
      isPinned: true,
      isOfficialAnnouncement: true,
    });
    setAnnTitle('');
    setAnnBody('');
  };

  const renderPostsList = (list: CommunityPost[], emptyLabel: string) =>
    list.length === 0 ? (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
        {emptyLabel}
      </div>
    ) : (
      <div className="space-y-4">
        {list.map((post) => (
          <PostFeedCard
            key={post.id}
            post={post}
            onOpenThread={onOpenThread}
            onOpenCommunity={() => {}}
            onOpenStudentProfile={onOpenStudentProfile}
            onEditPost={onEditPost}
            onReportPost={onReportPost}
          />
        ))}
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Communities
      </button>

      {/* Community Editorial Hero Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-44 sm:h-52 w-full relative overflow-hidden">
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
            <div>
              <p className="text-xs font-semibold text-blue-300">
                {community.category}
                {community.isDemoCommunity ? ' · Demo Community' : ''}
              </p>
              <h2 className="text-2xl font-bold tracking-tight">{community.name}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenComposer('discussion', community.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" /> Create Post
              </button>

              <button
                type="button"
                onClick={() => (joined ? leaveCommunity(community.id) : joinCommunity(community.id))}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  joined
                    ? 'bg-white/95 text-slate-900 hover:bg-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {joined ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Joined
                  </>
                ) : (
                  'Join Community'
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleMuteCommunity(community.id)}
                className="p-2 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white cursor-pointer"
                title={muted ? 'Unmute community notifications' : 'Mute community notifications'}
              >
                <BellOff className={`w-4 h-4 ${muted ? 'text-orange-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            {community.description}
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {community.members.length} members
            </span>
            <span>{commPosts.length} posts</span>
            {role && (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                Role: {role}
              </span>
            )}
          </div>
        </div>

        {/* Community Sub-Navigation */}
        <nav className="px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            {renderPostsList(commPosts, 'No posts in this community yet. Be the first to start a discussion!')}
          </div>
          <div className="lg:col-span-4 space-y-4">
            {announcements.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 inline-flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5" /> Pinned Announcements
                </p>
                {announcements.slice(0, 2).map((ann) => (
                  <button
                    key={ann.id}
                    type="button"
                    onClick={() => onOpenThread(ann.id)}
                    className="block w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                      {ann.title}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Community Rules
              </p>
              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal pl-4">
                {community.rules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Discussions' &&
        renderPostsList(discussions, 'No general discussions in this community yet.')}

      {activeTab === 'Questions' &&
        renderPostsList(questions, 'No academic questions asked here yet.')}

      {activeTab === 'Resources' &&
        renderPostsList(resources, 'No study resources shared in this community yet.')}

      {activeTab === 'Announcements' && (
        <div className="space-y-4">
          {isModerator && (
            <form
              onSubmit={handlePublishAnnouncement}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Publish Official Pinned Announcement
              </p>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement headline..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
              <textarea
                rows={3}
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="Details for community members..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Publish & Pin Announcement
                </button>
              </div>
            </form>
          )}
          {renderPostsList(announcements, 'No announcements posted in this community yet.')}
        </div>
      )}

      {activeTab === 'Members' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Community Members ({community.members.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {community.members.map((member) => {
              const stu = getStudentById(member.studentId);
              if (!stu) return null;
              return (
                <div key={member.studentId} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenStudentProfile(stu.id)}
                    className="flex items-center gap-3 text-left cursor-pointer"
                  >
                    <img
                      src={stu.avatarUrl}
                      alt={stu.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600">
                        {stu.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {stu.course} · <span className="font-semibold text-blue-600 dark:text-blue-400">{member.role}</span>
                      </p>
                    </div>
                  </button>

                  {isOwner && member.studentId !== currentStudentId && (
                    <div className="flex items-center gap-2 text-xs">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          assignCommunityRole(
                            community.id,
                            member.studentId,
                            e.target.value as CommunityMemberRole
                          )
                        }
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-200"
                      >
                        <option value="Member">Member</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Owner">Owner</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeCommunityMember(community.id, member.studentId)}
                        className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
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

      {activeTab === 'Rules' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Community Guidelines & Moderation Settings
            </h3>
            {isModerator && (
              <button
                type="button"
                onClick={() => {
                  setEditDesc(community.description);
                  setEditRulesText(community.rules.join('\n'));
                  setEditInfoOpen((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                {editInfoOpen ? 'Close Editor' : 'Manage Community'}
              </button>
            )}
          </div>

          <ol className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5">
            {community.rules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ol>

          {isModerator && editInfoOpen && (
            <form
              onSubmit={handleSaveSettings}
              className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4"
            >
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={community.requirePostApproval}
                  onChange={(e) =>
                    updateCommunityDetails(community.id, {
                      requirePostApproval: e.target.checked,
                    })
                  }
                  className="accent-blue-600"
                />
                Require moderator approval before new member posts go public
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Community Description
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rules (one per line)
                </label>
                <textarea
                  rows={4}
                  value={editRulesText}
                  onChange={(e) => setEditRulesText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Community Settings
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
