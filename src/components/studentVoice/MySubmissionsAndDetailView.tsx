import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentVoice } from '../../context/StudentVoiceContext';
import { formatVoiceDate } from '../../data/studentVoiceData';
import type { VoiceSubmission } from '../../types/studentVoice';

type SubmissionsFilterTab =
  | 'All'
  | 'Feedback'
  | 'Complaints'
  | 'Suggestions'
  | 'Resolved'
  | 'Drafts';

interface Props {
  searchQuery: string;
  selectedSubmission: VoiceSubmission | null;
  onSelectSubmission: (sub: VoiceSubmission | null) => void;
}

export const MySubmissionsAndDetailView: React.FC<Props> = ({
  searchQuery,
  selectedSubmission,
  onSelectSubmission,
}) => {
  const { user } = useAuth();
  const { mySubmissions, manageMySubmission, runVoiceAiAssistant } = useStudentVoice();

  const [subTab, setSubTab] = useState<SubmissionsFilterTab>('All');
  const [followUpText, setFollowUpText] = useState('');
  const [draftEditTitle, setDraftEditTitle] = useState('');
  const [draftEditDesc, setDraftEditDesc] = useState('');
  const [statusExplanation, setStatusExplanation] = useState<string | null>(null);

  const activeSub = selectedSubmission
    ? mySubmissions.find((s) => s.id === selectedSubmission.id) || selectedSubmission
    : null;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mySubmissions.filter((s) => {
      if (subTab === 'Feedback' && !['General Feedback', 'Appreciation'].includes(s.feedbackType)) {
        return false;
      }
      if (subTab === 'Complaints' && s.feedbackType !== 'Complaint') return false;
      if (
        subTab === 'Suggestions' &&
        !['Suggestion', 'Improvement Request'].includes(s.feedbackType)
      ) {
        return false;
      }
      if (subTab === 'Resolved' && !['Resolved', 'Closed'].includes(s.status)) return false;
      if (subTab === 'Drafts' && s.status !== 'Draft') return false;
      if (q) {
        const hay = `${s.referenceNumber} ${s.title} ${s.department} ${s.categoryGroup} ${s.categoryItem}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [mySubmissions, subTab, searchQuery]);

  if (activeSub) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            onSelectSubmission(null);
            setStatusExplanation(null);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Submissions</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Submission Detail & Institutional Responses */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#2563EB] tabular-nums">
                  {activeSub.referenceNumber} · {activeSub.feedbackType} · {activeSub.privacyMode}
                </div>
                <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
                  {activeSub.title}
                </h2>
                <div className="text-xs text-[#64748B] dark:text-slate-400">
                  {activeSub.categoryGroup} / {activeSub.categoryItem} · Department:{' '}
                  {activeSub.assignedDepartment || activeSub.department}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] text-xs font-bold">
                  {activeSub.status}
                </div>
                <div className="text-[11px] text-[#64748B] tabular-nums">
                  Submitted {formatVoiceDate(activeSub.createdAt)}
                </div>
              </div>
            </div>

            {activeSub.status === 'Draft' ? (
              <div className="space-y-3 text-xs">
                <input
                  type="text"
                  defaultValue={activeSub.title}
                  onChange={(e) => setDraftEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                />
                <textarea
                  rows={4}
                  defaultValue={activeSub.description}
                  onChange={(e) => setDraftEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void manageMySubmission(activeSub.id, {
                        title: draftEditTitle || activeSub.title,
                        description: draftEditDesc || activeSub.description,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                  >
                    Save Draft Changes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void manageMySubmission(activeSub.id, {
                        title: draftEditTitle || activeSub.title,
                        description: draftEditDesc || activeSub.description,
                        submitNow: true,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
                  >
                    Submit Draft Now
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm text-[#172033] dark:text-slate-200">
                  <p className="whitespace-pre-wrap leading-relaxed">{activeSub.description}</p>
                  {activeSub.location && (
                    <div className="text-xs text-[#64748B]">Location: {activeSub.location}</div>
                  )}
                  {activeSub.desiredOutcome && (
                    <div className="text-xs text-[#64748B]">
                      Desired Outcome: {activeSub.desiredOutcome}
                    </div>
                  )}
                </div>

                {activeSub.attachments.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-[#64748B]">Evidence Attachments</div>
                    <div className="flex flex-wrap gap-2">
                      {activeSub.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={`${att.url}?userId=${encodeURIComponent(user?.id || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#2563EB] font-semibold hover:underline"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{att.fileName}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official Institutional Responses */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                    Institutional Responses ({activeSub.officialResponses.length})
                  </h3>
                  {activeSub.officialResponses.length === 0 ? (
                    <p className="text-xs text-[#64748B]">
                      No official department response has been recorded yet.
                    </p>
                  ) : (
                    activeSub.officialResponses.map((resp) => (
                      <div
                        key={resp.id}
                        className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-[#2563EB]">
                          <span>
                            {resp.department} ({resp.responderRole})
                          </span>
                          <span className="tabular-nums text-[#64748B]">
                            {formatVoiceDate(resp.createdAt)}
                          </span>
                        </div>
                        <p className="text-[#172033] dark:text-slate-200 leading-relaxed">
                          {resp.message}
                        </p>
                        {resp.resolutionNotes && (
                          <div className="text-emerald-700 dark:text-emerald-300 font-semibold pt-1">
                            Resolution Note: {resp.resolutionNotes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Follow-up & Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {activeSub.status !== 'Closed' && activeSub.status !== 'Rejected' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!followUpText.trim()) return;
                        const res = await manageMySubmission(activeSub.id, {
                          action: 'followup',
                          message: followUpText,
                        });
                        if (res) setFollowUpText('');
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={followUpText}
                        onChange={(e) => setFollowUpText(e.target.value)}
                        placeholder="Add permitted follow-up context or clarification..."
                        className="flex-1 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {activeSub.status === 'Resolved' && (
                      <>
                        <button
                          type="button"
                          onClick={() => void manageMySubmission(activeSub.id, { action: 'close' })}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept & Close Complaint</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void manageMySubmission(activeSub.id, {
                              action: 'reopen',
                              message: 'Student requested additional review.',
                            })
                          }
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-amber-600 text-white font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reopen Issue</span>
                        </button>
                      </>
                    )}
                    {['Submitted', 'Under Review', 'Assigned', 'Awaiting Student Response'].includes(
                      activeSub.status
                    ) && (
                      <button
                        type="button"
                        onClick={() => void manageMySubmission(activeSub.id, { action: 'withdraw' })}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        Withdraw Request
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        const r = await runVoiceAiAssistant('explain-status', activeSub.status);
                        setStatusExplanation(`${r.sourceLabel}:\n${r.reply}`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-[#2563EB] cursor-pointer"
                    >
                      Explain Current Status (AI)
                    </button>
                  </div>

                  {statusExplanation && (
                    <pre className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 whitespace-pre-wrap font-sans text-[#64748B] dark:text-slate-300">
                      {statusExplanation}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#172033] dark:text-slate-100">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>Activity Timeline</span>
            </div>
            {activeSub.timeline.length === 0 ? (
              <p className="text-xs text-[#64748B]">Draft saved — timeline starts upon submission.</p>
            ) : (
              <div className="space-y-3">
                {activeSub.timeline.map((step) => (
                  <div
                    key={step.id}
                    className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-[#172033] dark:text-slate-100">
                      <span>{step.label}</span>
                      <span className="tabular-nums text-[11px] text-[#64748B]">
                        {formatVoiceDate(step.createdAt)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#2563EB] font-semibold">
                      {step.actorLabel}
                    </div>
                    <p className="text-[#64748B] dark:text-slate-300">{step.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filterTabs: SubmissionsFilterTab[] = [
    'All',
    'Feedback',
    'Complaints',
    'Suggestions',
    'Resolved',
    'Drafts',
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            My Submissions & Complaint Tracking
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Track status updates, view official department replies, manage drafts, and follow up safely.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSubTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                subTab === t
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#64748B]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-[#172033] dark:text-slate-100">
            No submissions in "{subTab}" view.
          </p>
          <p className="text-xs text-[#64748B]">
            Your private complaints and anonymous/confidential submissions appear strictly to you and authorized reviewers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const latestTimeline = sub.timeline[sub.timeline.length - 1];
            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubmission(sub)}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#2563EB] tabular-nums">
                      {sub.referenceNumber}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-[#172033] dark:text-slate-200">
                      {sub.status}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[#64748B]">{sub.privacyMode}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                    {sub.title}
                  </h3>
                  <div className="text-xs text-[#64748B] dark:text-slate-400">
                    {sub.categoryGroup} / {sub.categoryItem} ·{' '}
                    {formatVoiceDate(sub.createdAt)} ·{' '}
                    {latestTimeline ? `Latest: ${latestTimeline.label}` : 'Saved Draft'}
                  </div>
                </div>

                <span className="text-xs font-semibold text-[#2563EB] shrink-0">
                  Open Timeline →
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
