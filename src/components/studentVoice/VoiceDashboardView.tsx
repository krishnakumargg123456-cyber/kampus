import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Megaphone,
  MessageSquarePlus,
  Search,
  ShieldCheck,
  ThumbsUp,
  Vote,
} from 'lucide-react';
import { useStudentVoice } from '../../context/StudentVoiceContext';
import { VOICE_MEDIA, formatVoiceDate } from '../../data/studentVoiceData';
import type { FeedbackType, VoiceSubmission } from '../../types/studentVoice';

export type VoiceTabId =
  | 'dashboard'
  | 'submit'
  | 'submissions'
  | 'ideas'
  | 'polls'
  | 'transparency'
  | 'admin';

interface Props {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onNavigateTab: (tab: VoiceTabId) => void;
  onStartSubmission: (type: FeedbackType) => void;
  onInspectSubmission: (sub: VoiceSubmission) => void;
}

export const VoiceDashboardView: React.FC<Props> = ({
  searchQuery,
  onSearchQueryChange,
  onNavigateTab,
  onStartSubmission,
  onInspectSubmission,
}) => {
  const {
    mySubmissions,
    publicResolutions,
    institutionalUpdates,
    polls,
    ideas,
  } = useStudentVoice();

  const openPolls = polls.filter((p) => p.status === 'Open');
  const popularIdeas = [...ideas].sort((a, b) => b.supporterIds.length - a.supporterIds.length);
  const initiatives = institutionalUpdates.filter((u) => u.status !== 'Notice');
  const notices = institutionalUpdates.filter((u) => u.status === 'Notice');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateTab('submissions');
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#172554] text-white">
        <img
          src={VOICE_MEDIA.hero}
          alt="Students collaborating on campus improvements"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              KAMPUS Student Voice · Institutional Feedback & Transparency
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Your Voice Can Make a Difference.
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              Share your concerns, suggest improvements, participate in official campus polls, and track institutional responses securely.
            </p>

            <form onSubmit={handleSearch} className="pt-1 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center bg-white text-slate-900 rounded-xl px-3.5 py-2.5">
                <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="Search your reference number, ideas, polls, or updates..."
                  className="w-full text-sm bg-transparent focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-sm font-semibold shrink-0 cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Primary 4 Hero Actions */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onStartSubmission('General Feedback')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Submit Feedback</span>
              </button>
              <button
                type="button"
                onClick={() => onStartSubmission('Complaint')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>Raise a Concern</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('ideas')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Share an Idea</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('submissions')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Track My Submissions</span>
              </button>
            </div>
          </div>

          <div className="w-full lg:w-72 rounded-xl bg-white dark:bg-slate-900 text-[#172033] dark:text-slate-100 p-5 border border-slate-200 dark:border-slate-700 space-y-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy & Genuine Data</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800">
                <div className="text-lg font-bold tabular-nums">{mySubmissions.length}</div>
                <div className="text-[11px] text-[#64748B]">My Requests</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800">
                <div className="text-lg font-bold tabular-nums">{openPolls.length}</div>
                <div className="text-[11px] text-[#64748B]">Open Polls</div>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-relaxed">
              Counts and updates reflect live platform records only. Confidential identities are masked from ordinary reviewers.
            </p>
          </div>
        </div>
      </div>

      {/* A & B: My Recent Submissions & Recently Resolved Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
              A. My Recent Submissions
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('submissions')}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View all ({mySubmissions.length})
            </button>
          </div>
          {mySubmissions.length === 0 ? (
            <div className="py-4 text-xs text-[#64748B] space-y-2">
              <p>You have not submitted any feedback, complaints, or drafts yet.</p>
              <button
                type="button"
                onClick={() => onStartSubmission('General Feedback')}
                className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
              >
                Create your first submission
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {mySubmissions.slice(0, 3).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onInspectSubmission(sub)}
                  className="w-full text-left p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#2563EB] tabular-nums">
                      {sub.referenceNumber} · {sub.status} · {sub.privacyMode}
                    </div>
                    <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {sub.title}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {sub.categoryGroup} · {sub.department}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
              B. Recently Resolved Issues (Approved Public Summary)
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('transparency')}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Transparency Board
            </button>
          </div>
          {publicResolutions.length === 0 ? (
            <p className="text-xs text-[#64748B] py-4">
              No resolved issues have been cleared for public disclosure yet. Private complaints remain strictly confidential.
            </p>
          ) : (
            <div className="space-y-2">
              {publicResolutions.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {res.status} · {res.department}
                    </span>
                  </div>
                  <div className="font-bold text-[#172033] dark:text-slate-100">{res.title}</div>
                  <p className="text-[#64748B] dark:text-slate-400">{res.latestUpdate}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* C, D, F: Institutional Updates & Open Polls / Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
            C & G. Institutional Updates & Campus Initiatives
          </h3>
          {[...notices, ...initiatives].length === 0 ? (
            <p className="text-xs text-[#64748B]">No institutional updates published.</p>
          ) : (
            <div className="space-y-2.5">
              {institutionalUpdates.slice(0, 3).map((upd) => (
                <div
                  key={upd.id}
                  className="p-3.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1 text-xs"
                >
                  <div className="font-semibold text-[#2563EB]">
                    {upd.status} · {upd.department}
                  </div>
                  <div className="font-bold text-sm text-[#172033] dark:text-slate-100">
                    {upd.title}
                  </div>
                  <p className="text-[#64748B] dark:text-slate-300">{upd.summary}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
              D & F. Open Feedback Campaigns & Student Polls
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('polls')}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Vote in Polls ({openPolls.length})
            </button>
          </div>
          {openPolls.length === 0 ? (
            <p className="text-xs text-[#64748B]">No active polls right now.</p>
          ) : (
            <div className="space-y-2.5">
              {openPolls.slice(0, 3).map((poll) => (
                <div
                  key={poll.id}
                  className="p-3.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#F97316]">
                      {poll.pollType} · Closes {formatVoiceDate(poll.closingDateISO)}
                    </div>
                    <div className="font-bold text-sm text-[#172033] dark:text-slate-100 mt-0.5">
                      {poll.title}
                    </div>
                    <div className="text-[#64748B] tabular-nums">
                      Genuine responses: {poll.totalResponses} · {poll.hasVoted ? 'You responded' : 'Open for response'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('polls')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold shrink-0 cursor-pointer"
                  >
                    <Vote className="w-3.5 h-3.5" />
                    <span>{poll.hasVoted ? 'View' : 'Respond'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* E: Popular Improvement Suggestions */}
      <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
            E. Popular Improvement Suggestions
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('ideas')}
            className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
          >
            Open Ideas Hub ({ideas.length})
          </button>
        </div>
        {popularIdeas.length === 0 ? (
          <p className="text-xs text-[#64748B]">
            No community ideas posted yet. Be the first to propose a constructive campus improvement in the Ideas Hub.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {popularIdeas.slice(0, 3).map((idea) => (
              <div
                key={idea.id}
                onClick={() => onNavigateTab('ideas')}
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5 cursor-pointer hover:border-[#2563EB]"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2563EB]">{idea.status}</span>
                  <span className="inline-flex items-center gap-1 font-bold tabular-nums text-[#172033] dark:text-slate-100">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {idea.supporterIds.length}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                  {idea.title}
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-2">
                  {idea.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
