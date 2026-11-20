import React, { useState } from 'react';
import {
  Trophy,
  Upload,
  Download,
  Star,
  Pencil,
  Trash2,
  Eye,
  Check,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotesExchange } from '../../context/NotesExchangeContext';
import { SharedNoteItem } from '../../types/notesExchange';

export const MyContributionsView: React.FC = () => {
  const {
    state,
    openUploadModal,
    setSelectedNoteId,
    updateOwnNote,
    deleteOwnNote,
  } = useNotesExchange();

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const ownNotes = state.notes.filter((n) => n.isOwnUpload);
  const totalDownloads = ownNotes.reduce((sum, n) => sum + n.downloads, 0);
  const avgRating =
    ownNotes.length > 0
      ? (
          ownNotes.reduce((sum, n) => sum + n.rating, 0) / ownNotes.length
        ).toFixed(1)
      : '—';

  const startEdit = (note: SharedNoteItem) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditCourse(note.course);
    setEditSummary(note.summary);
  };

  const saveEdit = (noteId: string) => {
    if (!editTitle.trim()) return;
    updateOwnNote(noteId, {
      title: editTitle.trim(),
      course: editCourse.trim(),
      summary: editSummary.trim(),
    });
    setEditingNoteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Contributor Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Contributor Karma</span>
            <Trophy className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {state.karmaPoints.toLocaleString()}
          </div>
          <Link
            to="/tools/rewards"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-2"
          >
            <span>Redeem in KAMPUS Rewards</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Published Notes & Total Downloads</span>
            <Download className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {ownNotes.length} notes · {totalDownloads}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Helping peers prepare across campuses
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Average Peer Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-current" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {avgRating} / 5.0
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Verified contributor status active
          </p>
        </div>
      </div>

      {/* Uploaded Notes Management */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            Your Uploaded Study Notes ({ownNotes.length})
          </h3>
          <button
            type="button"
            onClick={() => openUploadModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Note</span>
          </button>
        </div>

        {ownNotes.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
            You have not uploaded any study notes yet. Click &ldquo;Upload New Note&rdquo; to earn +100 Karma.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ownNotes.map((note) => {
              const isEditing = editingNoteId === note.id;
              const isConfirmingDelete = confirmDeleteId === note.id;

              return (
                <div key={note.id} className="py-4 first:pt-1 last:pb-1 space-y-3">
                  {isEditing ? (
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={editCourse}
                          onChange={(e) => setEditCourse(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <input
                        type="text"
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(note.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {note.course} · {note.format} · {note.dateLabel}
                        </div>
                        <h4
                          onClick={() => setSelectedNoteId(note.id)}
                          className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer truncate"
                        >
                          {note.title}
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {note.downloads} downloads · {note.rating.toFixed(1)} rating ({note.reviews.length} reviews) · +{note.karmaReward} Karma
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedNoteId(note.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(note)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                deleteOwnNote(note.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(note.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Karma Activity Ledger */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 shadow-2xs">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
          Notes Exchange Karma Ledger
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {state.karmaHistory.map((item) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                {item.event}
              </span>
              <div className="flex items-center gap-3 shrink-0 tabular-nums">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{item.points} Karma
                </span>
                <span className="text-xs text-slate-400">{item.dateLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
