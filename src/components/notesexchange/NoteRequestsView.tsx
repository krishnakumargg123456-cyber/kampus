import React, { useState } from 'react';
import {
  Plus,
  ThumbsUp,
  CheckCircle2,
  Upload,
  Eye,
  HelpCircle,
} from 'lucide-react';
import { useNotesExchange } from '../../context/NotesExchangeContext';
import { NoteEducationLevel } from '../../types/notesExchange';

interface NoteRequestsViewProps {
  searchQuery: string;
}

export const NoteRequestsView: React.FC<NoteRequestsViewProps> = ({
  searchQuery,
}) => {
  const {
    state,
    createRequest,
    toggleUpvoteRequest,
    openUploadModal,
    setSelectedNoteId,
  } = useNotesExchange();

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'fulfilled'>(
    'all'
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('CS-305 (Operating Systems)');
  const [semesterOrTerm, setSemesterOrTerm] = useState('Semester 6');
  const [level, setLevel] = useState<NoteEducationLevel>('Undergraduate');
  const [bountyKarma, setBountyKarma] = useState(75);
  const [details, setDetails] = useState('');

  const qLower = searchQuery.trim().toLowerCase();
  const filteredRequests = state.requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!qLower) return true;
    return (
      r.title.toLowerCase().includes(qLower) ||
      r.course.toLowerCase().includes(qLower) ||
      r.details.toLowerCase().includes(qLower) ||
      r.requesterName.toLowerCase().includes(qLower)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;
    createRequest({
      title,
      course,
      semesterOrTerm,
      level,
      details,
      bountyKarma,
    });
    setTitle('');
    setDetails('');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'open', 'fulfilled'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {status === 'all'
                ? `All Requests (${state.requests.length})`
                : status === 'open'
                ? `Open Bounties (${state.requests.filter((r) => r.status === 'open').length})`
                : `Fulfilled (${state.requests.filter((r) => r.status === 'fulfilled').length})`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'Close Form' : 'Request Missing Notes'}</span>
        </button>
      </div>

      {/* Create Request Panel */}
      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
        >
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Post a Syllabus Note Request
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Offer a Bonus Karma bounty to encourage peers with complete lecture notes to upload them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Topic / Chapter Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Compiler Design LR(1) & LALR Parser Construction Solved Examples"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course Code & Subject
              </label>
              <input
                type="text"
                required
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as NoteEducationLevel)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Class 11–12">Class 11–12</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Competitive Exam">Competitive Exam</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bounty Karma
                </label>
                <select
                  value={bountyKarma}
                  onChange={(e) => setBountyKarma(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 tabular-nums"
                >
                  <option value={50}>+50 Karma</option>
                  <option value={75}>+75 Karma</option>
                  <option value={100}>+100 Karma</option>
                  <option value={150}>+150 Karma</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specific Topics / Exam Focus *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Mention exact derivations, textbook chapters, or PYQs peers should include..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester / Class
              </label>
              <input
                type="text"
                value={semesterOrTerm}
                onChange={(e) => setSemesterOrTerm(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              Post Note Request
            </button>
          </div>
        </form>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No matching note requests
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Post a request above to ask classmates for missing lectures or derivations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const isOpen = req.status === 'open';
            return (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                      {req.course} · {req.semesterOrTerm}
                    </span>
                    <span
                      className={`font-bold tabular-nums shrink-0 ${
                        isOpen
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isOpen
                        ? `OPEN · +${req.bountyKarma} Bounty Karma`
                        : 'FULFILLED'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {req.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {req.details}
                  </p>

                  <div className="text-[11px] text-slate-400 pt-1">
                    Requested by {req.requesterName} · {req.requesterCollege} · {req.dateLabel}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleUpvoteRequest(req.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold tabular-nums cursor-pointer transition-colors ${
                      req.upvotedByUser
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Need this ({req.upvotes})</span>
                  </button>

                  {isOpen ? (
                    <button
                      type="button"
                      onClick={() =>
                        openUploadModal({
                          title: req.title,
                          course: req.course,
                          source: 'request',
                          fulfillRequestId: req.id,
                          bountyKarma: req.bountyKarma,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fulfill (+{100 + req.bountyKarma} Karma)</span>
                    </button>
                  ) : (
                    req.fulfilledNoteId && (
                      <button
                        type="button"
                        onClick={() => setSelectedNoteId(req.fulfilledNoteId!)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Fulfilled Note</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
