import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowBigUp,
  BellOff,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  CornerDownRight,
  Edit3,
  FileText,
  FileUp,
  Flag,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommunityAttachment, CommunityPost } from '../../types/community';
import { useCommunity } from '../../context/CommunityContext';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';
import { formatFileSize, formatRelativeTime, readAttachmentFile } from './communityUtils';

interface DiscussionThreadModalProps {
  postId: string | null;
  onClose: () => void;
  onOpenCommunity: (communityId: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onEditPost: (post: CommunityPost) => void;
  onReportTarget: (target: {
    targetType: 'post' | 'answer' | 'comment';
    targetId: string;
    targetTitle: string;
  }) => void;
}

export const DiscussionThreadModal: React.FC<DiscussionThreadModalProps> = ({
  postId,
  onClose,
  onOpenCommunity,
  onOpenStudentProfile,
  onEditPost,
  onReportTarget,
}) => {
  const navigate = useNavigate();
  const {
    state,
    currentStudentId,
    getCommunityById,
    getUserRoleInCommunity,
    isPostMuted,
    hasVotedInPoll,
    togglePostUpvote,
    togglePostHelpful,
    togglePostBookmark,
    toggleMutePost,
    voteInPoll,
    submitAnswer,
    editAnswer,
    deleteAnswer,
    toggleAnswerUpvote,
    toggleAnswerHelpful,
    acceptAnswer,
    addCommentOrReply,
    editCommentOrReply,
    deleteCommentOrReply,
    toggleReplyUpvote,
    saveResourceToStudyHub,
    askAiHelper,
    showToast,
  } = useCommunity();

  const post = useMemo(() => state.posts.find((p) => p.id === postId) || null, [state.posts, postId]);

  const [answerText, setAnswerText] = useState('');
  const [answerAttachment, setAnswerAttachment] = useState<CommunityAttachment | undefined>(undefined);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSort, setCommentSort] = useState<'relevant' | 'newest'>('relevant');

  // Inline reply & edit states
  const [replyingToKey, setReplyingToKey] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editingAnswerText, setEditingAnswerText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = useState('');

  // Poll multi-select
  const [selectedPollOpts, setSelectedPollOpts] = useState<string[]>([]);

  // KAMPUS AI Assistant state
  const [aiLoadingMode, setAiLoadingMode] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ label: string; text: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!post) return null;

  const community = getCommunityById(post.communityId);
  const role = getUserRoleInCommunity(post.communityId);
  const isPostAuthor = post.authorId === currentStudentId;
  const isModerator = role === 'Owner' || role === 'Moderator';
  const hasUpvoted = post.upvoterIds.includes(currentStudentId);
  const hasHelpful = post.helpfulIds.includes(currentStudentId);
  const isBookmarked = post.bookmarkedByIds.includes(currentStudentId);
  const muted = isPostMuted(post.id);
  const userVotedPoll = hasVotedInPoll(post.id);
  const pollTotalVotes = post.poll
    ? post.poll.options.reduce((sum, opt) => sum + opt.voterIds.length, 0)
    : 0;

  const sortedAnswers = [...post.answers].sort((a, b) => {
    if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
    if (commentSort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return b.upvoterIds.length + b.helpfulVoterIds.length - (a.upvoterIds.length + a.helpfulVoterIds.length);
  });

  const sortedComments = [...post.comments].sort((a, b) => {
    if (commentSort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return b.upvoterIds.length - a.upvoterIds.length;
  });

  const handleAnswerAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswerError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await readAttachmentFile(file);
    if (res.error) setAnswerError(res.error);
    else if (res.attachment) setAnswerAttachment(res.attachment);
    e.target.value = '';
  };

  const handlePostAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (answerText.trim().length < 5) {
      setAnswerError('Please write a clear answer (at least 5 characters).');
      return;
    }
    submitAnswer(post.id, answerText, answerAttachment);
    setAnswerText('');
    setAnswerAttachment(undefined);
    setAnswerError(null);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentOrReply(post.id, commentText);
    setCommentText('');
  };

  const runAiAction = async (mode: 'summarize' | 'explain' | 'related-questions', label: string) => {
    setAiLoadingMode(mode);
    setAiError(null);
    const threadContext = `Title: ${post.title}\nPost Type: ${post.type}\nBody:\n${post.content}\n\nTop Answers:\n${post.answers
      .slice(0, 3)
      .map((a, idx) => `Answer ${idx + 1}: ${a.content}`)
      .join('\n\n')}`;
    const res = await askAiHelper(mode, threadContext);
    setAiLoadingMode(null);
    if (res.error) setAiError(res.error);
    else setAiResult({ label, text: res.text });
  };

  const openInKampusAi = () => {
    localStorage.setItem(
      'kampus_ai_handoff_v1',
      JSON.stringify({
        tool: post.type === 'Ask a Question' ? 'explain' : 'chat',
        prompt: `Help me understand and practice this topic from KAMPUS Student Community:\n\n${post.title}\n\n${post.content}`,
      })
    );
    navigate('/learn/kampus-ai');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
            {community && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCommunity(community.id);
                }}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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
            {post.questionStatus && (
              <>
                <span>·</span>
                <span
                  className={`font-semibold ${
                    post.questionStatus === 'Solved'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : post.questionStatus === 'Answered'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {post.questionStatus}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPostAuthor && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditPost(post);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* Author + Title + Body */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStudentProfile(post.authorId);
                }}
                className="flex items-center gap-3 text-left cursor-pointer group"
              >
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {post.authorName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {post.authorCourse} · {post.authorSemester} · {formatRelativeTime(post.createdAt)}
                  </p>
                </div>
              </button>

              {!isPostAuthor && (
                <button
                  type="button"
                  onClick={() =>
                    onReportTarget({ targetType: 'post', targetId: post.id, targetTitle: post.title })
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-orange-600 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {post.title}
            </h2>

            <div className="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Attachment */}
            {post.attachment && (
              <div className="mt-4">
                {post.attachment.kind === 'image' ? (
                  <img
                    src={post.attachment.dataUrl}
                    alt={post.attachment.fileName}
                    className="max-h-96 rounded-xl border border-slate-200 dark:border-slate-800 object-contain bg-slate-50 dark:bg-slate-950"
                  />
                ) : (
                  <a
                    href={post.attachment.dataUrl}
                    download={post.attachment.fileName}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{post.attachment.fileName}</span>
                    <span className="text-xs text-slate-500">
                      ({formatFileSize(post.attachment.sizeBytes)})
                    </span>
                  </a>
                )}
              </div>
            )}

            {/* Poll inside Thread */}
            {post.poll && (
              <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{post.poll.question}</p>
                  <span className="text-xs text-slate-500 tabular-nums">{pollTotalVotes} votes</span>
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
                        disabled={userVotedPoll}
                        onClick={() => {
                          if (!post.poll || userVotedPoll) return;
                          if (post.poll.allowMultiple) {
                            setSelectedPollOpts((prev) =>
                              prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                            );
                          } else {
                            voteInPoll(post.id, [opt.id]);
                          }
                        }}
                        className={`relative w-full text-left rounded-xl border px-3.5 py-2.5 overflow-hidden ${
                          votedThis || checkedMulti
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                        } ${userVotedPoll ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {userVotedPoll && (
                          <div
                            className="absolute inset-y-0 left-0 bg-blue-500/12 dark:bg-blue-400/15"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                        <div className="relative flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {opt.label}
                          </span>
                          {userVotedPoll && (
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                              {pct}% ({votes})
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {post.poll.allowMultiple && !userVotedPoll && (
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      disabled={selectedPollOpts.length === 0}
                      onClick={() => voteInPoll(post.id, selectedPollOpts)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      Submit Vote
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePostUpvote(post.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    hasUpvoted
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ArrowBigUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                  Upvote ({post.upvoterIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => togglePostHelpful(post.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    hasHelpful
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Helpful ({post.helpfulIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => togglePostBookmark(post.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    isBookmarked
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {isBookmarked ? 'Saved' : 'Bookmark'}
                </button>
                <button
                  type="button"
                  onClick={() => saveResourceToStudyHub(post)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Save to Study Hub
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleMutePost(post.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <BellOff className="w-3.5 h-3.5" /> {muted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(`${window.location.origin}/connect/community?post=${post.id}`).catch(() => {});
                    }
                    showToast('Link copied.');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* KAMPUS AI Study Assistant Strip */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  KAMPUS AI Study Assistant
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={Boolean(aiLoadingMode)}
                  onClick={() => runAiAction('summarize', 'Discussion Summary')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer disabled:opacity-50"
                >
                  {aiLoadingMode === 'summarize' ? 'Summarizing...' : 'Summarize Discussion'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(aiLoadingMode)}
                  onClick={() => runAiAction('explain', 'Concept Explanation')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer disabled:opacity-50"
                >
                  {aiLoadingMode === 'explain' ? 'Explaining...' : 'Explain Answer'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(aiLoadingMode)}
                  onClick={() => runAiAction('related-questions', 'Practice Questions')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer disabled:opacity-50"
                >
                  {aiLoadingMode === 'related-questions' ? 'Generating...' : 'Related Questions'}
                </button>
                <button
                  type="button"
                  onClick={openInKampusAi}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Open in KAMPUS AI
                </button>
              </div>
            </div>

            {aiError && (
              <p className="text-xs text-orange-600 dark:text-orange-400">{aiError}</p>
            )}

            {aiResult && (
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 text-sm text-slate-700 dark:text-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{aiResult.label}</span>
                  <button
                    type="button"
                    onClick={() => setAiResult(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                <MarkdownRenderer content={aiResult.text} />
              </div>
            )}
          </div>

          {/* Sort Header for Answers / Comments */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {post.type === 'Ask a Question'
                ? `Peer Answers (${post.answers.length})`
                : `Discussion Comments (${post.comments.length})`}
            </h3>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Sort:</span>
              <button
                type="button"
                onClick={() => setCommentSort('relevant')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  commentSort === 'relevant'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Most Helpful
              </button>
              <button
                type="button"
                onClick={() => setCommentSort('newest')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                  commentSort === 'newest'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Newest
              </button>
            </div>
          </div>

          {/* Q&A Answers Section (shown when post is Ask a Question OR already has answers) */}
          {(post.type === 'Ask a Question' || sortedAnswers.length > 0) && (
            <div className="space-y-4">
              {sortedAnswers.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No answers yet. Share a clear step-by-step explanation below!
                </p>
              ) : (
                sortedAnswers.map((ans) => {
                  const ansAuthor = ans.authorId === currentStudentId;
                  const ansUpvoted = ans.upvoterIds.includes(currentStudentId);
                  const ansHelpful = ans.helpfulVoterIds.includes(currentStudentId);

                  return (
                    <div
                      key={ans.id}
                      className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                        ans.isAccepted
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={ans.authorAvatar}
                            alt={ans.authorName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenStudentProfile(ans.authorId);
                              }}
                              className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                            >
                              {ans.authorName}
                            </button>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {ans.authorCourse} · {formatRelativeTime(ans.createdAt)}
                              {ans.updatedAt ? ' (edited)' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {ans.isAccepted && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" /> Accepted Answer
                            </span>
                          )}
                          {isPostAuthor && (
                            <button
                              type="button"
                              onClick={() => acceptAnswer(post.id, ans.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                                ans.isAccepted
                                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {ans.isAccepted ? 'Accepted' : 'Mark Accepted'}
                            </button>
                          )}
                        </div>
                      </div>

                      {editingAnswerId === ans.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={editingAnswerText}
                            onChange={(e) => setEditingAnswerText(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingAnswerId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                editAnswer(post.id, ans.id, editingAnswerText);
                                setEditingAnswerId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-700 dark:text-slate-200">
                          <MarkdownRenderer content={ans.content} />
                        </div>
                      )}

                      {ans.attachment && ans.attachment.kind === 'image' && (
                        <img
                          src={ans.attachment.dataUrl}
                          alt={ans.attachment.fileName}
                          className="max-h-64 rounded-xl border border-slate-200 dark:border-slate-700"
                        />
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleAnswerUpvote(post.id, ans.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold cursor-pointer ${
                              ansUpvoted
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <ArrowBigUp className="w-3.5 h-3.5" /> {ans.upvoterIds.length}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAnswerHelpful(post.id, ans.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold cursor-pointer ${
                              ansHelpful
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" /> Helpful ({ans.helpfulVoterIds.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToKey(`ans:${ans.id}`);
                              setReplyDraft('');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" /> Reply
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {ansAuthor && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAnswerId(ans.id);
                                setEditingAnswerText(ans.content);
                              }}
                              className="text-slate-500 hover:text-blue-600 cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {(ansAuthor || isModerator) && (
                            <button
                              type="button"
                              onClick={() => deleteAnswer(post.id, ans.id)}
                              className="text-slate-500 hover:text-red-600 cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                          {!ansAuthor && (
                            <button
                              type="button"
                              onClick={() =>
                                onReportTarget({
                                  targetType: 'answer',
                                  targetId: ans.id,
                                  targetTitle: ans.content.slice(0, 60),
                                })
                              }
                              className="text-slate-400 hover:text-orange-600 cursor-pointer"
                            >
                              Report
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nested Replies on Answer */}
                      {ans.replies.length > 0 && (
                        <div className="pl-4 border-l border-slate-200 dark:border-slate-700 space-y-2.5 pt-1">
                          {ans.replies.map((rep) => {
                            const isRepAuthor = rep.authorId === currentStudentId;
                            return (
                              <div key={rep.id} className="text-xs space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {rep.authorName} ·{' '}
                                    <span className="font-normal text-slate-500">
                                      {formatRelativeTime(rep.createdAt)}
                                    </span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleReplyUpvote(post.id, rep.id, ans.id)}
                                      className="text-slate-500 hover:text-blue-600 cursor-pointer"
                                    >
                                      ▲ {rep.upvoterIds.length}
                                    </button>
                                    {isRepAuthor && (
                                      <button
                                        type="button"
                                        onClick={() => deleteCommentOrReply(post.id, rep.id, ans.id)}
                                        className="text-slate-400 hover:text-red-500 cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300">{rep.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {replyingToKey === `ans:${ans.id}` && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={replyDraft}
                            onChange={(e) => setReplyDraft(e.target.value)}
                            placeholder="Write a follow-up reply..."
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (replyDraft.trim()) {
                                addCommentOrReply(post.id, replyDraft, ans.id);
                                setReplyingToKey(null);
                                setReplyDraft('');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Answer Composer */}
              <form
                onSubmit={handlePostAnswer}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3"
              >
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                  Write Your Answer
                </label>
                {answerError && <p className="text-xs text-red-600">{answerError}</p>}
                <textarea
                  rows={4}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Share step-by-step reasoning, code, or exam tips..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {answerAttachment && (
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Attached: {answerAttachment.fileName}</span>
                    <button
                      type="button"
                      onClick={() => setAnswerAttachment(undefined)}
                      className="text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.txt,.md"
                      onChange={handleAnswerAttachment}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                    >
                      <FileUp className="w-3.5 h-3.5" /> Attach diagram or note
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Answer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Discussion Comments Section (for non-question posts or general comments) */}
          {post.type !== 'Ask a Question' && (
            <div className="space-y-3">
              {sortedComments
                .filter((c) => !c.parentId)
                .map((comment) => {
                  const childReplies = sortedComments.filter((r) => r.parentId === comment.id);
                  const isCommentAuthor = comment.authorId === currentStudentId;

                  return (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenStudentProfile(comment.authorId);
                            }}
                            className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                          >
                            {comment.authorName}
                          </button>
                          <span className="text-slate-400">· {formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleReplyUpvote(post.id, comment.id)}
                            className="text-slate-500 hover:text-blue-600 cursor-pointer tabular-nums"
                          >
                            ▲ {comment.upvoterIds.length}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToKey(`com:${comment.id}`);
                              setReplyDraft('');
                            }}
                            className="text-slate-500 hover:text-blue-600 cursor-pointer"
                          >
                            Reply
                          </button>
                          {isCommentAuthor && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReplyId(comment.id);
                                setEditingReplyText(comment.content);
                              }}
                              className="text-slate-500 hover:text-blue-600 cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {(isCommentAuthor || isModerator) && (
                            <button
                              type="button"
                              onClick={() => deleteCommentOrReply(post.id, comment.id)}
                              className="text-slate-500 hover:text-red-600 cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                          {!isCommentAuthor && (
                            <button
                              type="button"
                              onClick={() =>
                                onReportTarget({
                                  targetType: 'comment',
                                  targetId: comment.id,
                                  targetTitle: comment.content.slice(0, 50),
                                })
                              }
                              className="text-slate-400 hover:text-orange-600 cursor-pointer"
                            >
                              Report
                            </button>
                          )}
                        </div>
                      </div>

                      {editingReplyId === comment.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingReplyText}
                            onChange={(e) => setEditingReplyText(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              editCommentOrReply(post.id, comment.id, editingReplyText);
                              setEditingReplyId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 dark:text-slate-200">{comment.content}</p>
                      )}

                      {childReplies.length > 0 && (
                        <div className="pl-4 border-l border-slate-200 dark:border-slate-700 space-y-2 pt-1">
                          {childReplies.map((r) => (
                            <div key={r.id} className="text-xs space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
                                  <CornerDownRight className="w-3 h-3 text-slate-400" />
                                  {r.authorName} ·{' '}
                                  <span className="font-normal text-slate-400">
                                    {formatRelativeTime(r.createdAt)}
                                  </span>
                                </span>
                                {(r.authorId === currentStudentId || isModerator) && (
                                  <button
                                    type="button"
                                    onClick={() => deleteCommentOrReply(post.id, r.id)}
                                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 pl-4">{r.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyingToKey === `com:${comment.id}` && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={replyDraft}
                            onChange={(e) => setReplyDraft(e.target.value)}
                            placeholder="Write a nested reply..."
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (replyDraft.trim()) {
                                addCommentOrReply(post.id, replyDraft, undefined, comment.id);
                                setReplyingToKey(null);
                                setReplyDraft('');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a thoughtful comment..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Post
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
