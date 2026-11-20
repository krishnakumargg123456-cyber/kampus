import React, { useMemo, useState } from 'react';
import { BarChart3, BookOpen, ExternalLink, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '../../context/CommunityContext';
import { CommunityPost } from '../../types/community';
import { PostFeedCard } from './PostFeedCard';

interface PollsAndResourcesViewProps {
  onOpenComposer: () => void;
  onOpenThread: (postId: string) => void;
  onOpenCommunity: (communityId: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onEditPost: (post: CommunityPost) => void;
  onReportPost: (post: CommunityPost) => void;
}

export const PollsAndResourcesView: React.FC<PollsAndResourcesViewProps> = ({
  onOpenComposer,
  onOpenThread,
  onOpenCommunity,
  onOpenStudentProfile,
  onEditPost,
  onReportPost,
}) => {
  const navigate = useNavigate();
  const { visiblePosts, saveResourceToStudyHub, getCommunityById } = useCommunity();
  const [section, setSection] = useState<'polls' | 'resources'>('polls');

  const pollPosts = useMemo(() => visiblePosts.filter((p) => Boolean(p.poll)), [visiblePosts]);
  const resourcePosts = useMemo(
    () =>
      visiblePosts.filter(
        (p) => p.type === 'Share a Resource' || Boolean(p.linkedResourceTitle) || Boolean(p.attachment)
      ),
    [visiblePosts]
  );

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSection('polls')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              section === 'polls'
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Student Polls ({pollPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('resources')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              section === 'resources'
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Shared Study Resources ({resourcePosts.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/learn/notes-exchange')}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Notes Exchange <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenComposer}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Poll / Resource
          </button>
        </div>
      </div>

      {section === 'polls' ? (
        pollPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
            No polls active yet. Create a poll inside any new discussion post!
          </div>
        ) : (
          <div className="space-y-4">
            {pollPosts.map((post) => (
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
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resourcePosts.map((post) => {
            const comm = getCommunityById(post.communityId);
            return (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {post.linkedResourceType || 'Study Resource'} · {comm?.name || 'Community'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenThread(post.id)}
                    className="mt-1 text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 text-left cursor-pointer"
                  >
                    {post.linkedResourceTitle || post.title}
                  </button>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                    {post.linkedResourceSummary || post.content}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenStudentProfile(post.authorId)}
                    className="text-xs font-medium text-slate-500 hover:text-blue-600 cursor-pointer"
                  >
                    Shared by {post.authorName}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveResourceToStudyHub(post)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Open in Study Hub
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
