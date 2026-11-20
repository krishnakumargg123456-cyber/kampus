import React, { useMemo } from 'react';
import { Award, Ban, Flag, UserCheck, UserPlus, X } from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';

interface PublicStudentProfileModalProps {
  studentId: string | null;
  onClose: () => void;
  onOpenThread: (postId: string) => void;
  onReportStudent: (studentId: string, name: string) => void;
}

export const PublicStudentProfileModal: React.FC<PublicStudentProfileModalProps> = ({
  studentId,
  onClose,
  onOpenThread,
  onReportStudent,
}) => {
  const {
    currentStudentId,
    visiblePosts,
    contributorStats,
    getStudentById,
    isFollowingStudent,
    isBlockedStudent,
    toggleFollowStudent,
    toggleBlockStudent,
  } = useCommunity();

  const student = studentId ? getStudentById(studentId) : undefined;
  const stats = useMemo(
    () => contributorStats.find((c) => c.student.id === studentId),
    [contributorStats, studentId]
  );

  const recentPosts = useMemo(
    () =>
      visiblePosts
        .filter((p) => p.authorId === studentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [visiblePosts, studentId]
  );

  if (!studentId || !student) return null;

  const isSelf = student.id === currentStudentId;
  const following = isFollowingStudent(student.id);
  const blocked = isBlockedStudent(student.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Student Public Profile {student.isDemoProfile ? '· Demo Peer' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Identity Summary — zero email/phone/hostel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{student.name}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {student.course} · {student.semester}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{student.college}</p>
              </div>
            </div>

            {!isSelf && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleFollowStudent(student.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
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
              </div>
            )}
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {student.intro}
          </p>

          {/* Academic Interests */}
          {student.interests.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Academic Interests
              </p>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {student.interests.join(' · ')}
              </p>
            </div>
          )}

          {/* Contributions & Badges */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-center tabular-nums">
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{stats.postsCount}</p>
                <p className="text-[11px] text-slate-500">Posts</p>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{stats.answersCount}</p>
                <p className="text-[11px] text-slate-500">Answers</p>
              </div>
              <div>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.acceptedAnswersCount}
                </p>
                <p className="text-[11px] text-slate-500">Accepted</p>
              </div>
              <div>
                <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {stats.helpfulVotesCount}
                </p>
                <p className="text-[11px] text-slate-500">Helpful</p>
              </div>
            </div>
          )}

          {stats && stats.badges.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
              <Award className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="font-semibold">Earned Badges:</span>
              <span>{stats.badges.join(' · ')}</span>
            </div>
          )}

          {/* Recent Contributions */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Recent Community Contributions
            </p>
            {recentPosts.length === 0 ? (
              <p className="text-xs text-slate-500">No recent public posts.</p>
            ) : (
              <div className="space-y-2">
                {recentPosts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenThread(p.id);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.type}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {p.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safety Controls */}
          {!isSelf && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReportStudent(student.id, student.name);
                }}
                className="inline-flex items-center gap-1.5 text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" /> Report profile
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleBlockStudent(student.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" /> {blocked ? 'Unblock user' : 'Block user'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
