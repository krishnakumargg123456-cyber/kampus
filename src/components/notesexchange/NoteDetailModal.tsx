import React, { useState } from 'react';
import {
  X,
  Download,
  Bookmark,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  Flag,
  Star,
  CheckCircle2,
  FileText,
  Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotesExchange } from '../../context/NotesExchangeContext';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';

export const NoteDetailModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedNote,
    setSelectedNoteId,
    state,
    downloadNote,
    toggleSaveNote,
    savePeerNoteToStudyHub,
    prepareAiHandoffPayload,
    submitReview,
    reportNote,
  } = useNotesExchange();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportReason, setReportReason] = useState('Incomplete syllabus coverage');

  if (!selectedNote) return null;

  const isSaved = state.savedNoteIds.includes(selectedNote.id);
  const isReported = state.reportedNoteIds.includes(selectedNote.id);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    submitReview(selectedNote.id, reviewRating, reviewComment);
    setReviewComment('');
    setReviewRating(5);
  };

  const handleLaunchAi = (toolId: 'quiz' | 'explain') => {
    prepareAiHandoffPayload(selectedNote, toolId);
    setSelectedNoteId(null);
    navigate('/learn/kampus-ai');
  };

  const handleReportSubmit = () => {
    reportNote(selectedNote.id, reportReason);
    setShowReportBox(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-reader-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Modal Bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-900">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>{selectedNote.course}</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-600 dark:text-slate-300">
                {selectedNote.semesterOrTerm}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-600 dark:text-slate-300">
                {selectedNote.format}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{selectedNote.karmaReward} Karma
              </span>
            </div>
            <h2
              id="note-reader-title"
              className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug"
            >
              {selectedNote.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                <img
                  src={selectedNote.authorAvatar}
                  alt={selectedNote.authorName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{selectedNote.authorName}</span>
                {selectedNote.isVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                )}
              </span>
              <span>{selectedNote.authorCollege}</span>
              <span className="tabular-nums">
                {selectedNote.pagesCount} pages · {selectedNote.downloads} downloads
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                <Star className="w-3.5 h-3.5 fill-current" />
                {selectedNote.rating.toFixed(1)} ({selectedNote.reviews.length} reviews)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedNoteId(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            aria-label="Close reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Strip */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => downloadNote(selectedNote)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {selectedNote.attachment
                ? `Download (${selectedNote.attachment.fileName})`
                : 'Download Study Note (.md)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => savePeerNoteToStudyHub(selectedNote)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Save to Study Hub</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchAi('quiz')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Generate AI Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => handleLaunchAi('explain')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Explain with KAMPUS AI</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSaveNote(selectedNote.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              isSaved
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <button
            type="button"
            disabled={isReported}
            onClick={() => setShowReportBox((v) => !v)}
            className={`ml-auto inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              isReported
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isReported ? 'Reported' : 'Report'}</span>
          </button>
        </div>

        {/* Scrollable Content + Attachment Preview + Reviews */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {showReportBox && !isReported && (
            <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs font-semibold text-rose-900 dark:text-rose-200 shrink-0">
                  Issue:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option>Incomplete syllabus coverage</option>
                  <option>Incorrect formula or proof</option>
                  <option>Unreadable scan or broken attachment</option>
                  <option>Copyright / attribution concern</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportBox(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReportSubmit}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}

          {/* Attached File Preview if user uploaded an image or PDF */}
          {selectedNote.attachment && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Attached File: {selectedNote.attachment.fileName}</span>
                </div>
                <span className="text-slate-400 tabular-nums">
                  {Math.max(1, Math.round(selectedNote.attachment.sizeBytes / 1024))} KB
                </span>
              </div>
              {selectedNote.attachment.dataUrl &&
                selectedNote.attachment.mimeType.startsWith('image/') && (
                  <img
                    src={selectedNote.attachment.dataUrl}
                    alt={selectedNote.attachment.fileName}
                    className="max-h-80 rounded-lg border border-slate-200 dark:border-slate-700 object-contain bg-white"
                  />
                )}
            </div>
          )}

          {/* Structured Study Note Content */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 p-5 sm:p-6">
            <MarkdownRenderer content={selectedNote.content || selectedNote.summary} />
            {selectedNote.tags.length > 0 && (
              <div className="mt-5 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300 mr-2">
                  Topics covered:
                </span>
                {selectedNote.tags.join(' · ')}
              </div>
            )}
          </div>

          {/* Peer Reviews Section */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Peer Reviews & Accuracy Feedback ({selectedNote.reviews.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                +10 Karma for helpful reviews
              </span>
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rate clarity & exam usefulness:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-0.5 cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= reviewRating
                            ? 'text-amber-500 fill-current'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share how these notes helped or note any corrections..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={!reviewComment.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Review</span>
                </button>
              </div>
            </form>

            {selectedNote.reviews.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                No peer reviews yet. Be the first student to rate and review this study material.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                {selectedNote.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {rev.authorName}{' '}
                        <span className="font-normal text-slate-400">
                          · {rev.authorCollege}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-amber-500 font-semibold tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {rev.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
