import React, { useMemo, useState } from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QUESTION_SUBJECTS } from '../../data/communityData';
import { useCommunity } from '../../context/CommunityContext';
import { CommunityPost, QuestionStatus, QuestionSubject } from '../../types/community';
import { PostFeedCard } from './PostFeedCard';

interface QuestionsAndAnswersViewProps {
  searchQuery: string;
  onOpenComposer: () => void;
  onOpenThread: (postId: string) => void;
  onOpenCommunity: (communityId: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onEditPost: (post: CommunityPost) => void;
  onReportPost: (post: CommunityPost) => void;
}

export const QuestionsAndAnswersView: React.FC<QuestionsAndAnswersViewProps> = ({
  searchQuery,
  onOpenComposer,
  onOpenThread,
  onOpenCommunity,
  onOpenStudentProfile,
  onEditPost,
  onReportPost,
}) => {
  const navigate = useNavigate();
  const { visiblePosts } = useCommunity();
  const [statusFilter, setStatusFilter] = useState<'All' | QuestionStatus>('All');
  const [subjectFilter, setSubjectFilter] = useState<'All' | QuestionSubject>('All');
  const [sortBy, setSortBy] = useState<'latest' | 'unanswered' | 'upvoted'>('latest');

  const questions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visiblePosts
      .filter((p) => p.type === 'Ask a Question')
      .filter((p) => (statusFilter === 'All' ? true : p.questionStatus === statusFilter))
      .filter((p) => (subjectFilter === 'All' ? true : p.subject === subjectFilter))
      .filter((p) => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.subject && p.subject.toLowerCase().includes(q)) ||
          (p.topicTag && p.topicTag.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'upvoted') return b.upvoterIds.length - a.upvoterIds.length;
        if (sortBy === 'unanswered') return a.answers.length - b.answers.length;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [visiblePosts, statusFilter, subjectFilter, sortBy, searchQuery]);

  const counts = useMemo(() => {
    const allQ = visiblePosts.filter((p) => p.type === 'Ask a Question');
    return {
      total: allQ.length,
      unanswered: allQ.filter((p) => p.questionStatus === 'Unanswered').length,
      solved: allQ.filter((p) => p.questionStatus === 'Solved').length,
    };
  }, [visiblePosts]);

  return (
    <div className="space-y-5">
      {/* Q&A Header Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Academic Questions & Peer Solutions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {counts.total} questions · {counts.unanswered} awaiting first answer · {counts.solved} solved
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(
                'kampus_ai_handoff_v1',
                JSON.stringify({
                  tool: 'quiz',
                  prompt:
                    subjectFilter !== 'All'
                      ? `Generate a practice quiz on ${subjectFilter}`
                      : 'Generate a concept check quiz for my current coursework',
                })
              );
              navigate('/learn/kampus-ai');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Practice Quiz in KAMPUS AI
          </button>

          <button
            type="button"
            onClick={onOpenComposer}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" /> Ask a Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Unanswered', 'Answered', 'Solved'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value as 'All' | QuestionSubject)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Subjects</option>
            {QUESTION_SUBJECTS.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="latest">Latest Questions</option>
            <option value="unanswered">Needs Answers First</option>
            <option value="upvoted">Most Upvoted</option>
          </select>
        </div>
      </div>

      {/* Question Feed */}
      {questions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
          <p className="text-base font-bold text-slate-900 dark:text-white">No questions found</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Adjust the subject or status filter, or ask the first question in this topic.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((post) => (
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
    </div>
  );
};
