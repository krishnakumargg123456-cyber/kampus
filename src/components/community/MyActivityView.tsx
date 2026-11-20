import React, { useMemo, useState } from 'react';
import { Bell, FileEdit, ShieldAlert, Trash2, UserX } from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { ActivitySubTab, CommunityPost, CommunityPostDraft } from '../../types/community';
import { formatRelativeTime } from './communityUtils';
import { PostFeedCard } from './PostFeedCard';

const ACTIVITY_TABS: ActivitySubTab[] = [
  'My Posts',
  'My Questions',
  'My Answers',
  'Saved Posts',
  'Liked Posts',
  'Followed Communities',
  'Followed Students',
  'My Polls',
  'Drafts',
];

interface MyActivityViewProps {
  onOpenThread: (postId: string) => void;
  onOpenCommunity: (communityId: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onEditPost: (post: CommunityPost) => void;
  onReportPost: (post: CommunityPost) => void;
  onResumeDraft: (draft: CommunityPostDraft) => void;
}

export const MyActivityView: React.FC<MyActivityViewProps> = ({
  onOpenThread,
  onOpenCommunity,
  onOpenStudentProfile,
  onEditPost,
  onReportPost,
  onResumeDraft,
}) => {
  const {
    state,
    currentStudentId,
    visiblePosts,
    getStudentById,
    isMemberOfCommunity,
    leaveCommunity,
    toggleFollowStudent,
    toggleBlockStudent,
    deleteDraft,
    updateNotificationPrefs,
  } = useCommunity();

  const [subTab, setSubTab] = useState<ActivitySubTab>('My Posts');

  const myPosts = useMemo(
    () => visiblePosts.filter((p) => p.authorId === currentStudentId && p.type !== 'Ask a Question'),
    [visiblePosts, currentStudentId]
  );
  const myQuestions = useMemo(
    () => visiblePosts.filter((p) => p.authorId === currentStudentId && p.type === 'Ask a Question'),
    [visiblePosts, currentStudentId]
  );
  const myAnswersThreads = useMemo(
    () =>
      visiblePosts.filter((p) =>
        p.answers.some((a) => a.authorId === currentStudentId)
      ),
    [visiblePosts, currentStudentId]
  );
  const savedPosts = useMemo(
    () => visiblePosts.filter((p) => p.bookmarkedByIds.includes(currentStudentId)),
    [visiblePosts, currentStudentId]
  );
  const likedPosts = useMemo(
    () => visiblePosts.filter((p) => p.upvoterIds.includes(currentStudentId)),
    [visiblePosts, currentStudentId]
  );
  const myPolls = useMemo(
    () => visiblePosts.filter((p) => p.authorId === currentStudentId && Boolean(p.poll)),
    [visiblePosts, currentStudentId]
  );
  const joinedCommunities = useMemo(
    () => state.communities.filter((c) => isMemberOfCommunity(c.id)),
    [state.communities, isMemberOfCommunity]
  );
  const followedStudents = useMemo(
    () =>
      state.followedStudentIds
        .map((id) => getStudentById(id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [state.followedStudentIds, getStudentById]
  );

  const renderPostCards = (list: CommunityPost[], emptyMessage: string) =>
    list.length === 0 ? (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
        {emptyMessage}
      </div>
    ) : (
      <div className="space-y-4">
        {list.map((post) => (
          <PostFeedCard
            key={post.id}
            post={post}
            onOpenThread={onOpenThread}
            onOpenCommunity={onOpenCommunity}
            onOpenStudentProfile={onOpenStudentProfile}
            onEditPost={onEditPost}
            onReportPost={onReportPost}
          />
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Activity Area (8 cols) */}
      <div className="lg:col-span-8 space-y-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {ACTIVITY_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {subTab === 'My Posts' &&
          renderPostCards(myPosts, 'You have not published any discussion posts yet.')}
        {subTab === 'My Questions' &&
          renderPostCards(myQuestions, 'You have not asked any academic questions yet.')}
        {subTab === 'My Answers' &&
          renderPostCards(myAnswersThreads, 'You have not answered any questions yet.')}
        {subTab === 'Saved Posts' &&
          renderPostCards(savedPosts, 'No bookmarked discussions yet. Click the bookmark icon on any post to save it here.')}
        {subTab === 'Liked Posts' &&
          renderPostCards(likedPosts, 'No upvoted posts yet.')}
        {subTab === 'My Polls' &&
          renderPostCards(myPolls, 'You have not created any community polls yet.')}

        {subTab === 'Followed Communities' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Joined Communities ({joinedCommunities.length})
            </h3>
            {joinedCommunities.length === 0 ? (
              <p className="text-sm text-slate-500">You have not joined any communities yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {joinedCommunities.map((comm) => (
                  <div key={comm.id} className="py-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenCommunity(comm.id)}
                      className="text-left cursor-pointer"
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600">
                        {comm.name}
                      </p>
                      <p className="text-xs text-slate-500">{comm.category}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => leaveCommunity(comm.id)}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Leave
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === 'Followed Students' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Following ({followedStudents.length})
            </h3>
            {followedStudents.length === 0 ? (
              <p className="text-sm text-slate-500">You are not following any students yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {followedStudents.map((stu) => (
                  <div key={stu.id} className="py-3 flex items-center justify-between gap-3">
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
                        <p className="text-xs text-slate-500">{stu.course}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFollowStudent(stu.id)}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === 'Drafts' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Saved Drafts ({state.drafts.length})
            </h3>
            {state.drafts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No drafts saved. Use “Save Draft” inside the Create Post composer to continue writing later.
              </p>
            ) : (
              <div className="space-y-3">
                {state.drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        {draft.type} · Saved {formatRelativeTime(draft.savedAt)}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {draft.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onResumeDraft(draft)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDraft(draft.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Preferences & Safety Controls (4 cols) */}
      <aside className="lg:col-span-4 space-y-5">
        {/* Notification Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Community Alert Preferences
          </h3>
          <div className="space-y-2.5 text-xs">
            {(
              [
                ['replies', 'Replies & answers on discussions'],
                ['acceptedAnswers', 'Accepted answer milestones'],
                ['announcements', 'Official community announcements'],
                ['polls', 'Poll activity updates'],
                ['newPostsInFollowed', 'Posts in joined communities'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                <input
                  type="checkbox"
                  checked={state.notificationPrefs[key]}
                  onChange={(e) => updateNotificationPrefs({ [key]: e.target.checked })}
                  className="accent-blue-600"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Safety Reports Log */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            Submitted Safety Reports ({state.reports.length})
          </h3>
          {state.reports.length === 0 ? (
            <p className="text-xs text-slate-500">No reports submitted.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{rep.reason}</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{rep.status}</span>
                  </div>
                  <p className="text-slate-500 truncate">{rep.targetTitle}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blocked Users */}
        {state.blockedStudentIds.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
              <UserX className="w-4 h-4 text-red-500" />
              Blocked Accounts ({state.blockedStudentIds.length})
            </h3>
            <div className="space-y-2">
              {state.blockedStudentIds.map((id) => {
                const stu = getStudentById(id);
                return (
                  <div key={id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-200">{stu?.name || id}</span>
                    <button
                      type="button"
                      onClick={() => toggleBlockStudent(id)}
                      className="text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
