import React, { useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Flag,
  Lightbulb,
  MessageCircle,
  Plus,
  Share2,
  ShieldCheck,
  ThumbsUp,
  Vote,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentVoice } from '../../context/StudentVoiceContext';
import { VOICE_REPORT_REASONS, formatVoiceDate } from '../../data/studentVoiceData';
import type { VoiceAttachment } from '../../types/studentVoice';

export const IdeasHubView: React.FC = () => {
  const { user } = useAuth();
  const {
    ideas,
    bookmarkedIdeaIds,
    categories,
    createIdea,
    toggleIdeaSupport,
    toggleIdeaBookmark,
    addIdeaComment,
    submitAbuseReport,
    uploadAttachment,
    showToast,
  } = useStudentVoice();

  const userId = user?.id || 'usr_22b030149';

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(
    categories.find((c) => c.groupName === 'Suggestions')?.items[0] || 'New Campus Facilities'
  );
  const [description, setDescription] = useState('');
  const [expectedBenefits, setExpectedBenefits] = useState('');
  const [attachments, setAttachments] = useState<VoiceAttachment[]>([]);

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null);
  const [reportReason, setReportReason] = useState(VOICE_REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');

  const suggestionCategories =
    categories.find((c) => c.groupName === 'Suggestions')?.items || [
      'New Campus Facilities',
      'Academic Improvements',
      'Technology Improvements',
      'Student Engagement Ideas',
      'General Suggestions',
    ];

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createIdea({
      title,
      description,
      category,
      expectedBenefits,
      attachments,
    });
    if (ok) {
      setShowForm(false);
      setTitle('');
      setDescription('');
      setExpectedBenefits('');
      setAttachments([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Suggestion & Ideas Hub
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Propose practical campus improvements. Support counts reflect real individual student votes only.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Propose Campus Idea'}</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleSubmitIdea(e)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title (e.g., Quiet group study pods on Library Floor 3) *"
              className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {suggestionCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the improvement clearly *"
            className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <input
            value={expectedBenefits}
            onChange={(e) => setExpectedBenefits(e.target.value)}
            placeholder="Expected student benefit & feasibility note"
            className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer">
              <span>
                {attachments.length > 0 ? attachments.map((a) => a.fileName).join(', ') : 'Attach Mockup / Doc (optional)'}
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const att = await uploadAttachment(f, true);
                  if (att) setAttachments((p) => [...p, att]);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
            >
              Publish Idea
            </button>
          </div>
        </form>
      )}

      {ideas.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Lightbulb className="w-8 h-8 text-[#F97316] mx-auto" />
          <p className="text-sm font-semibold text-[#172033] dark:text-slate-100">
            No campus improvement ideas posted yet.
          </p>
          <p className="text-xs text-[#64748B]">
            Share constructive ideas for libraries, Wi-Fi, sustainability, clubs, or academic tools.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => {
            const supported = idea.supporterIds.includes(userId);
            const bookmarked = bookmarkedIdeaIds.includes(idea.id);
            return (
              <div
                key={idea.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2563EB]">{idea.status}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[#64748B]">{idea.category}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[#64748B]">
                      By {idea.authorName} · {formatVoiceDate(idea.createdAt)}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                  {idea.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-300 leading-relaxed">
                  {idea.description}
                </p>
                {idea.expectedBenefits && (
                  <div className="text-xs text-[#172033] dark:text-slate-200">
                    <strong>Expected Benefits:</strong> {idea.expectedBenefits}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => void toggleIdeaSupport(idea.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      supported
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="tabular-nums">Support ({idea.supporterIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleIdeaBookmark(idea.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      bookmarked
                        ? 'text-[#F97316] bg-orange-50 dark:bg-orange-950/40'
                        : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#64748B]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const txt = `Student Voice Idea: ${idea.title} (${idea.category})`;
                      try {
                        await navigator.clipboard.writeText(txt);
                        showToast('info', 'Idea summary copied to clipboard.');
                      } catch {
                        showToast('info', txt);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 text-[#64748B] font-semibold cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportTarget({ id: idea.id, title: idea.title })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report</span>
                  </button>
                </div>

                {/* Comments */}
                <div className="space-y-2 pt-2">
                  {idea.comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 text-xs"
                    >
                      <span className="font-bold text-[#172033] dark:text-slate-100">
                        {c.authorName}:{' '}
                      </span>
                      <span className="text-[#64748B] dark:text-slate-300">{c.content}</span>
                    </div>
                  ))}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const text = commentInputs[idea.id] || '';
                      if (!text.trim()) return;
                      const ok = await addIdeaComment(idea.id, text);
                      if (ok) setCommentInputs((prev) => ({ ...prev, [idea.id]: '' }));
                    }}
                    className="flex gap-2 text-xs"
                  >
                    <input
                      value={commentInputs[idea.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [idea.id]: e.target.value }))
                      }
                      placeholder="Add constructive discussion comment..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#172554] text-white font-semibold cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Comment</span>
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await submitAbuseReport({
                targetType: 'idea',
                targetId: reportTarget.id,
                targetTitle: reportTarget.title,
                reason: reportReason,
                details: reportDetails,
              });
              if (ok) {
                setReportTarget(null);
                setReportDetails('');
              }
            }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Report Inappropriate Content</span>
              </div>
              <button type="button" onClick={() => setReportTarget(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {VOICE_REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Explain why this violates campus safety or community guidelines..."
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const PollsAndSurveysView: React.FC = () => {
  const { polls, submitPollResponse } = useStudentVoice();
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});

  const toggleOption = (pollId: string, optionId: string, multi: boolean) => {
    setSelections((prev) => {
      const cur = prev[pollId] || [];
      if (!multi) return { ...prev, [pollId]: [optionId] };
      return {
        ...prev,
        [pollId]: cur.includes(optionId)
          ? cur.filter((x) => x !== optionId)
          : [...cur, optionId],
      };
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
          Student Polls & Feedback Campaigns
        </h2>
        <p className="text-xs text-[#64748B] dark:text-slate-400">
          Official single-choice, multiple-choice, rating, and text surveys with strict duplicate prevention and genuine vote totals.
        </p>
      </div>

      {polls.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-[#64748B]">
          No feedback campaigns are currently active.
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const isMulti = poll.pollType === 'Multiple-Choice Poll';
            const chosen = selections[poll.id] || [];
            return (
              <div
                key={poll.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="font-semibold text-[#2563EB]">
                      {poll.pollType} · {poll.department} ·{' '}
                      {poll.isAnonymousVoting ? 'Anonymous Voting' : 'Identified Voting'}
                    </div>
                    <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                      {poll.title}
                    </h3>
                    <p className="text-[#64748B] dark:text-slate-300">{poll.description}</p>
                  </div>

                  <div className="text-right tabular-nums text-[#64748B]">
                    <div>Closes: {formatVoiceDate(poll.closingDateISO)}</div>
                    <div className="font-bold text-[#172033] dark:text-slate-100">
                      {poll.totalResponses} genuine responses
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#64748B]">
                  Rule: {poll.participationRules}
                </div>

                {poll.pollType === 'Text Feedback Survey' ? (
                  poll.hasVoted ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Response recorded</span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <textarea
                        rows={3}
                        value={textInputs[poll.id] || ''}
                        onChange={(e) =>
                          setTextInputs((prev) => ({ ...prev, [poll.id]: e.target.value }))
                        }
                        placeholder="Write your feedback response..."
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          void submitPollResponse(poll.id, {
                            selectedOptionIds: [],
                            textAnswer: textInputs[poll.id] || '',
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
                      >
                        Submit Survey Response
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    {poll.options.map((opt) => {
                      const count = poll.optionCounts ? poll.optionCounts[opt.id] || 0 : null;
                      const pct =
                        count !== null && poll.totalResponses > 0
                          ? Math.round((count / poll.totalResponses) * 100)
                          : 0;
                      const isChecked = chosen.includes(opt.id);
                      return (
                        <div key={opt.id} className="space-y-1">
                          <label
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs cursor-pointer ${
                              isChecked
                                ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/30'
                                : 'border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {!poll.hasVoted && (
                                <input
                                  type={isMulti ? 'checkbox' : 'radio'}
                                  name={poll.id}
                                  checked={isChecked}
                                  onChange={() => toggleOption(poll.id, opt.id, isMulti)}
                                />
                              )}
                              <span className="font-semibold text-[#172033] dark:text-slate-100">
                                {opt.label}
                              </span>
                            </div>
                            {count !== null && (
                              <span className="tabular-nums font-bold text-[#2563EB]">
                                {count} ({pct}%)
                              </span>
                            )}
                          </label>
                          {count !== null && (
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-[#2563EB] transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {poll.hasVoted ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 pt-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Response recorded (duplicate voting locked)</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void submitPollResponse(poll.id, { selectedOptionIds: chosen })
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer mt-1"
                      >
                        <Vote className="w-3.5 h-3.5" />
                        <span>Submit Vote</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TransparencyBoardView: React.FC = () => {
  const { publicResolutions, institutionalUpdates, ideas, polls } = useStudentVoice();
  const implementedIdeas = ideas.filter((i) => ['Planned', 'Implemented'].includes(i.status));

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
        <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
          Institutional Response & Transparency Portal
        </h2>
        <p className="text-xs text-[#64748B] dark:text-slate-400">
          Publicly approved campus resolutions, implemented student suggestions, and official department action updates. Private complaints are never disclosed here, and feasibility reviews determine which suggestions are adopted.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
            Approved Resolved Campus Issues ({publicResolutions.length})
          </h3>
          {publicResolutions.length === 0 ? (
            <p className="text-xs text-[#64748B]">
              No resolved issues have been cleared for public publication yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {publicResolutions.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1 text-xs"
                >
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    {res.status} · {res.department} · {formatVoiceDate(res.resolvedAt)}
                  </div>
                  <div className="font-bold text-sm text-[#172033] dark:text-slate-100">
                    {res.title}
                  </div>
                  <p className="text-[#64748B] dark:text-slate-300">{res.latestUpdate}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
            Planned & Implemented Student Ideas ({implementedIdeas.length})
          </h3>
          {implementedIdeas.length === 0 ? (
            <p className="text-xs text-[#64748B]">
              Ideas marked Planned or Implemented by Campus Administration will appear here.
            </p>
          ) : (
            <div className="space-y-2.5">
              {implementedIdeas.map((id) => (
                <div
                  key={id.id}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1 text-xs"
                >
                  <div className="font-bold text-[#2563EB]">{id.status} · {id.category}</div>
                  <div className="font-bold text-sm text-[#172033] dark:text-slate-100">
                    {id.title}
                  </div>
                  <p className="text-[#64748B] dark:text-slate-300">{id.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
          Campus Improvement Initiatives & Survey Summaries
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {institutionalUpdates.map((upd) => (
            <div
              key={upd.id}
              className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1"
            >
              <div className="font-bold text-[#2563EB]">
                {upd.status} · {upd.department}
              </div>
              <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                {upd.title}
              </div>
              <p className="text-[#64748B] dark:text-slate-300">{upd.summary}</p>
              <div className="font-semibold text-[#172033] dark:text-slate-200 pt-1">
                Action: {upd.actionTaken}
              </div>
            </div>
          ))}
          {polls.map((pl) => (
            <div
              key={pl.id}
              className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1"
            >
              <div className="font-bold text-[#F97316]">
                Campaign · {pl.department}
              </div>
              <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                {pl.title}
              </div>
              <div className="tabular-nums text-[#64748B]">
                Total recorded votes: {pl.totalResponses} · Status: {pl.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
