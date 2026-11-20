import React from 'react';
import { Award, CheckCircle2, MessageSquare, ThumbsUp, UserCheck, UserPlus } from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { BADGE_DESCRIPTIONS } from './communityUtils';
import { BadgeName } from '../../types/community';

interface ContributorsViewProps {
  onOpenStudentProfile: (studentId: string) => void;
}

const ALL_BADGES: BadgeName[] = [
  'Helpful Member',
  'Knowledge Sharer',
  'Discussion Starter',
  'Community Supporter',
  'Top Contributor',
];

export const ContributorsView: React.FC<ContributorsViewProps> = ({ onOpenStudentProfile }) => {
  const {
    currentStudentId,
    contributorStats,
    isFollowingStudent,
    toggleFollowStudent,
  } = useCommunity();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Leaderboard (8 cols) */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Community Contributors Leaderboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Scores and recognition badges are calculated directly from verified posts, peer answers, accepted solutions, and helpful votes.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {contributorStats.map((entry, idx) => {
            const isSelf = entry.student.id === currentStudentId;
            const following = isFollowingStudent(entry.student.id);

            return (
              <div
                key={entry.student.id}
                className="py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span className="w-6 text-sm font-bold text-slate-400 tabular-nums pt-1.5">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenStudentProfile(entry.student.id)}
                    className="shrink-0 cursor-pointer"
                  >
                    <img
                      src={entry.student.avatarUrl}
                      alt={entry.student.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenStudentProfile(entry.student.id)}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                      >
                        {entry.student.name} {isSelf ? '(You)' : ''}
                      </button>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.student.course}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>{entry.postsCount} posts</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {entry.answersCount} answers
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> {entry.acceptedAnswersCount} accepted
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {entry.helpfulVotesCount} helpful
                      </span>
                    </div>

                    {entry.badges.length > 0 && (
                      <p className="mt-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        Badges: {entry.badges.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-9 sm:pl-0 shrink-0">
                  <div className="text-right">
                    <p className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {entry.score}
                    </p>
                    <p className="text-[11px] text-slate-400">points</p>
                  </div>

                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => toggleFollowStudent(entry.student.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        following
                          ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {following ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recognition Badges Legend (4 cols) */}
      <aside className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
          <Award className="w-4 h-4 text-orange-500" />
          Recognition Badges
        </h3>
        <div className="space-y-3">
          {ALL_BADGES.map((badge) => (
            <div key={badge} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{badge}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {BADGE_DESCRIPTIONS[badge]}
              </p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};
