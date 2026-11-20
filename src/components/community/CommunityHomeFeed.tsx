import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Calendar,
  Compass,
  Flame,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { CommunityPost, FeedTab } from '../../types/community';
import { PostFeedCard } from './PostFeedCard';

const FEED_TABS: FeedTab[] = [
  'For You',
  'Following',
  'Trending',
  'Latest',
  'Questions',
  'Discussions',
  'Announcements',
  'Study Tips',
  'Achievements',
];

interface CommunityHomeFeedProps {
  searchQuery: string;
  onSearchTag: (tag: string) => void;
  onOpenThread: (postId: string) => void;
  onOpenCommunity: (communityId: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onEditPost: (post: CommunityPost) => void;
  onReportPost: (post: CommunityPost) => void;
  onExploreCommunities: () => void;
  onOpenContributors: () => void;
}

export const CommunityHomeFeed: React.FC<CommunityHomeFeedProps> = ({
  searchQuery,
  onSearchTag,
  onOpenThread,
  onOpenCommunity,
  onOpenStudentProfile,
  onEditPost,
  onReportPost,
  onExploreCommunities,
  onOpenContributors,
}) => {
  const {
    state,
    currentStudentId,
    visiblePosts,
    contributorStats,
    trendingTags,
    isMemberOfCommunity,
    joinCommunity,
  } = useCommunity();

  const [feedTab, setFeedTab] = useState<FeedTab>('For You');
  const [sortBy, setSortBy] = useState<'relevant' | 'latest' | 'upvoted' | 'discussed'>('relevant');

  const joinedCommunities = useMemo(
    () => state.communities.filter((c) => isMemberOfCommunity(c.id)),
    [state.communities, isMemberOfCommunity]
  );

  const recommendedCommunities = useMemo(
    () => state.communities.filter((c) => !isMemberOfCommunity(c.id)).slice(0, 3),
    [state.communities, isMemberOfCommunity]
  );

  const upcomingActivities = useMemo(
    () =>
      state.communities
        .filter((c) => c.upcomingActivity)
        .map((c) => ({ community: c, activity: c.upcomingActivity! }))
        .slice(0, 4),
    [state.communities]
  );

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = visiblePosts.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.subject && p.subject.toLowerCase().includes(q)) ||
        (p.topicTag && p.topicTag.toLowerCase().includes(q))
      );
    });

    switch (feedTab) {
      case 'Following':
        list = list.filter(
          (p) =>
            state.followedStudentIds.includes(p.authorId) ||
            isMemberOfCommunity(p.communityId) ||
            p.authorId === currentStudentId
        );
        break;
      case 'Questions':
        list = list.filter((p) => p.type === 'Ask a Question');
        break;
      case 'Discussions':
        list = list.filter((p) => p.type === 'General Discussion');
        break;
      case 'Announcements':
        list = list.filter((p) => p.type === 'Academic Announcement' || p.isOfficialAnnouncement);
        break;
      case 'Study Tips':
        list = list.filter((p) => p.type === 'Share Study Tips');
        break;
      case 'Achievements':
        list = list.filter((p) => p.type === 'Share an Achievement');
        break;
      default:
        break;
    }

    return [...list].sort((a, b) => {
      if (feedTab === 'Trending' || sortBy === 'upvoted') {
        const scoreA = a.upvoterIds.length + a.helpfulIds.length + a.answers.length + a.comments.length;
        const scoreB = b.upvoterIds.length + b.helpfulIds.length + b.answers.length + b.comments.length;
        return scoreB - scoreA;
      }
      if (sortBy === 'discussed') {
        const countA = a.answers.length + a.comments.length;
        const countB = b.answers.length + b.comments.length;
        return countB - countA;
      }
      if (feedTab === 'Latest' || sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // For You / Relevant: prioritize joined communities + pinned + engagement
      const memberBoostA = isMemberOfCommunity(a.communityId) ? 3 : 0;
      const memberBoostB = isMemberOfCommunity(b.communityId) ? 3 : 0;
      const rankA = memberBoostA + a.upvoterIds.length + a.answers.length * 1.5;
      const rankB = memberBoostB + b.upvoterIds.length + b.answers.length * 1.5;
      if (rankB !== rankA) return rankB - rankA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    visiblePosts,
    searchQuery,
    feedTab,
    sortBy,
    state.followedStudentIds,
    isMemberOfCommunity,
    currentStudentId,
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT / MAIN EDITORIAL CONTENT (8 cols) */}
      <div className="lg:col-span-8 space-y-5">
        {/* Feed Category Strip + Sort */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {FEED_TABS.map((tab) => {
              const active = feedTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFeedTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 shrink-0"
            aria-label="Sort community feed"
          >
            <option value="relevant">Sort: Relevant</option>
            <option value="latest">Sort: Latest</option>
            <option value="upvoted">Sort: Most Upvoted</option>
            <option value="discussed">Sort: Most Discussed</option>
          </select>
        </div>

        {/* Feed Stream */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              No discussions match this filter yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Try switching feed categories, clearing the search query, or starting a new discussion.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
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
        )}

        {/* Recommended Communities Editorial Strip */}
        {recommendedCommunities.length > 0 && (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Recommended Communities
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Discover academic circles aligned with your coursework and exams.
                </p>
              </div>
              <button
                type="button"
                onClick={onExploreCommunities}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap cursor-pointer"
              >
                Explore all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {recommendedCommunities.map((comm) => (
                <div
                  key={comm.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div>
                    <img
                      src={comm.coverImage}
                      alt={comm.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {comm.category}
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenCommunity(comm.id)}
                        className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 text-left cursor-pointer"
                      >
                        {comm.name}
                      </button>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {comm.description}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 pb-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 tabular-nums">
                      {comm.members.length} members
                    </span>
                    <button
                      type="button"
                      onClick={() => joinCommunity(comm.id)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* RIGHT DESKTOP SIDEBAR (4 cols) */}
      <aside className="lg:col-span-4 space-y-5">
        {/* Your Communities */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Your Communities
            </h2>
            <button
              type="button"
              onClick={onExploreCommunities}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Browse ({state.communities.length})
            </button>
          </div>

          {joinedCommunities.length === 0 ? (
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p>You have not joined any communities yet.</p>
              <button
                type="button"
                onClick={onExploreCommunities}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" /> Explore communities
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {joinedCommunities.slice(0, 6).map((comm) => (
                <li key={comm.id} className="py-2 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => onOpenCommunity(comm.id)}
                    className="w-full flex items-center justify-between gap-2 text-left group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {comm.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{comm.category}</p>
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums shrink-0">
                      {comm.members.length} members
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Trending Topics */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            Trending Topics
          </h2>
          <div className="space-y-2">
            {trendingTags.slice(0, 6).map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => onSearchTag(item.tag)}
                className="w-full flex items-center justify-between text-xs py-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.tag}</span>
                <span className="text-slate-400 tabular-nums">
                  {item.count} {item.count === 1 ? 'post' : 'posts'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Top Contributors
            </h2>
            <button
              type="button"
              onClick={onOpenContributors}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Leaderboard
            </button>
          </div>
          <div className="space-y-3">
            {contributorStats.slice(0, 4).map((entry) => (
              <button
                key={entry.student.id}
                type="button"
                onClick={() => onOpenStudentProfile(entry.student.id)}
                className="w-full flex items-center justify-between gap-2 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={entry.student.avatarUrl}
                    alt={entry.student.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 truncate">
                      {entry.student.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {entry.answersCount} answers · {entry.helpfulVotesCount} helpful
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums shrink-0">
                  {entry.score} pts
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Community Activities */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-orange-500" />
            Upcoming Events & Sessions
          </h2>
          <div className="space-y-3">
            {upcomingActivities.map(({ community, activity }) => (
              <button
                key={community.id}
                type="button"
                onClick={() => onOpenCommunity(community.id)}
                className="w-full text-left block rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {activity.type} · {community.name}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {activity.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activity.dateLabel}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2 mb-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Community Guidelines
          </h2>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <li>1. Be constructive, respectful, and inclusive toward every learner.</li>
            <li>2. Share your reasoning or attempted steps when asking academic questions.</li>
            <li>3. Do not upload copyrighted exam leaks, spam, or unverified claims.</li>
            <li>4. Use the Report button to flag misleading or harmful content.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};
