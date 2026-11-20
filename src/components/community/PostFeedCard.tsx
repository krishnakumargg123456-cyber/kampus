import React, { useState } from 'react';
import {
  ArrowBigUp,
  BellOff,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Flag,
  HelpCircle,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Share2,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommunityPost } from '../../types/community';
import { useCommunity } from '../../context/CommunityContext';
import { formatFileSize, formatRelativeTime } from './communityUtils';

interface PostFeedCardProps {
  post: CommunityPost;
  onOpenThread: (postId: string) => void;
  onOpenCommunity: (communityId: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onEditPost: (post: CommunityPost) => void;
  onReportPost: (post: CommunityPost) => void;
}

export const PostFeedCard: React.FC<PostFeedCardProps> = ({
  post,
  onOpenThread,
  onOpenCommunity,
  onOpenStudentProfile,
  onEditPost,
  onReportPost,
}) => {
  const navigate = useNavigate();
  const {
    currentStudentId,
    getCommunityById,
    getUserRoleInCommunity,
    isPostMuted,
    hasVotedInPoll,
    togglePostUpvote,
    togglePostHelpful,
    togglePostBookmark,
    togglePinPost,
    approvePendingPost,
    deletePost,
    toggleMutePost,
    voteInPoll,
    saveResourceToStudyHub,
    showToast,
  } = useCommunity();

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPollOpts, setSelectedPollOpts] = useState<string[]>([]);

  const community = getCommunityById(post.communityId);
  const role = getUserRoleInCommunity(post.communityId);
  const isAuthor = post.authorId === currentStudentId;
  const isModerator = role === 'Owner' || role === 'Moderator';
  const hasUpvoted = post.upvoterIds.includes(currentStudentId);
  const hasHelpful = post.helpfulIds.includes(currentStudentId);
  const isBookmarked = post.bookmarkedByIds.includes(currentStudentId);
  const muted = isPostMuted(post.id);

  const replyCount =
    post.comments.length +
    post.answers.length +
    post.answers.reduce((acc, a) => acc + a.replies.length, 0);

  const pollTotalVotes = post.poll
    ? post.poll.options.reduce((sum, opt) => sum + opt.voterIds.length, 0)
    : 0;
  const userVotedPoll = hasVotedInPoll(post.id);
  const pollExpired =
    post.poll?.expiresAt ? new Date(post.poll.expiresAt).getTime() < Date.now() : false;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/connect/community?post=${post.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    showToast('Discussion link copied to clipboard.');
  };

  const handleTogglePollOption = (optId: string) => {
    if (!post.poll || userVotedPoll || pollExpired) return;
    if (post.poll.allowMultiple) {
      setSelectedPollOpts((prev) =>
        prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
      );
    } else {
      voteInPoll(post.id, [optId]);
    }
  };

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
      {/* Pending Approval Notice */}
      {post.pendingApproval && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3.5 py-2 text-xs text-amber-900 dark:text-amber-200">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5" />
            Pending community moderator approval
          </span>
          {isModerator && (
            <button
              type="button"
              onClick={() => approvePendingPost(post.id)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
            >
              Approve Post
            </button>
          )}
        </div>
      )}

      {/* Top Editorial Metadata Row — zero static pill boxes */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onOpenStudentProfile(post.authorId)}
            className="shrink-0 cursor-pointer"
          >
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => onOpenStudentProfile(post.authorId)}
                className="font-semibold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              >
                {post.authorName}
              </button>
              <span>·</span>
              <span className="truncate">{post.authorCourse}</span>
              <span>·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
              {post.updatedAt && <span className="italic">(edited)</span>}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {community && (
                <button
                  type="button"
                  onClick={() => onOpenCommunity(community.id)}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {community.name}
                </button>
              )}
              <span>·</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{post.type}</span>
              {post.subject && (
                <>
                  <span>·</span>
                  <span>{post.subject}</span>
                </>
              )}
              {post.isPinned && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                </>
              )}
              {post.questionStatus && (
                <>
                  <span>·</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      post.questionStatus === 'Solved'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : post.questionStatus === 'Answered'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {post.questionStatus === 'Solved' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5" />
                    )}
                    {post.questionStatus}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overflow Action Menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1.5 z-20 text-xs"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditPost(post);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit post
                </button>
              )}
              {isModerator && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    togglePinPost(post.id);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5" /> {post.isPinned ? 'Unpin from community' : 'Pin in community'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  toggleMutePost(post.id);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <BellOff className="w-3.5 h-3.5" /> {muted ? 'Unmute thread alerts' : 'Mute thread alerts'}
              </button>
              {!isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReportPost(post);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report post
                </button>
              )}
              {(isAuthor || isModerator) && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    deletePost(post.id);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title & Excerpt */}
      <button
        type="button"
        onClick={() => onOpenThread(post.id)}
        className="mt-3.5 block w-full text-left group cursor-pointer"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 whitespace-pre-line">
          {post.content.replace(/\*\*/g, '').replace(/```[\s\S]*?```/g, '[Code snippet]')}
        </p>
      </button>

      {/* Attachment Preview */}
      {post.attachment && (
        <div className="mt-3.5">
          {post.attachment.kind === 'image' ? (
            <button
              type="button"
              onClick={() => onOpenThread(post.id)}
              className="block w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 max-h-72 cursor-pointer"
            >
              <img
                src={post.attachment.dataUrl}
                alt={post.attachment.fileName}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenThread(post.id)}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {post.attachment.fileName}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
                {formatFileSize(post.attachment.sizeBytes)}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Embedded Poll */}
      {post.poll && (
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{post.poll.question}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
              {pollTotalVotes} {pollTotalVotes === 1 ? 'vote' : 'votes'}
              {post.poll.allowMultiple ? ' · Multi-select' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {post.poll.options.map((opt) => {
              const votes = opt.voterIds.length;
              const pct = pollTotalVotes > 0 ? Math.round((votes / pollTotalVotes) * 100) : 0;
              const votedThis = opt.voterIds.includes(currentStudentId);
              const checkedMulti = selectedPollOpts.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={userVotedPoll || pollExpired}
                  onClick={() => handleTogglePollOption(opt.id)}
                  className={`relative w-full text-left rounded-xl border px-3.5 py-2.5 overflow-hidden transition-colors ${
                    votedThis || checkedMulti
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                  } ${userVotedPoll || pollExpired ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {(userVotedPoll || pollExpired) && (
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500/12 dark:bg-blue-400/15 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {opt.label}
                      {votedThis ? ' (Your vote)' : ''}
                    </span>
                    {(userVotedPoll || pollExpired) && (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                        {pct}% ({votes})
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {post.poll.allowMultiple && !userVotedPoll && !pollExpired && (
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                disabled={selectedPollOpts.length === 0}
                onClick={() => voteInPoll(post.id, selectedPollOpts)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
              >
                Submit Vote
              </button>
            </div>
          )}
        </div>
      )}

      {/* Linked Study Resource Strip */}
      {(post.linkedResourceTitle || post.type === 'Share a Resource') && (
        <div className="mt-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {post.linkedResourceType || 'Study Resource'}
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {post.linkedResourceTitle || post.title}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => saveResourceToStudyHub(post)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Save to Study Hub
            </button>
            <button
              type="button"
              onClick={() => navigate('/learn/notes-exchange')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap cursor-pointer"
            >
              Notes Exchange <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Topic Tags (inline links, no pill clutter) */}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          {post.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => togglePostUpvote(post.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hasUpvoted
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowBigUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
            <span className="tabular-nums">{post.upvoterIds.length}</span>
            <span>Upvote</span>
          </button>

          <button
            type="button"
            onClick={() => togglePostHelpful(post.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hasHelpful
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="tabular-nums">{post.helpfulIds.length}</span>
            <span>Helpful</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenThread(post.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="tabular-nums">{replyCount}</span>
            <span>{post.type === 'Ask a Question' ? 'Answers & Replies' : 'Comments'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => togglePostBookmark(post.id)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isBookmarked
                ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/40'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Bookmark post"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Share discussion"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
