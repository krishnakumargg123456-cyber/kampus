import React, { useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Star,
} from 'lucide-react';
import { SharedNoteItem } from '../../types/notesExchange';
import { useNotesExchange } from '../../context/NotesExchangeContext';

interface NoteCardProps {
  note: SharedNoteItem;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const {
    state,
    setSelectedNoteId,
    downloadNote,
    toggleSaveNote,
  } = useNotesExchange();

  const [coverFailed, setCoverFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const isSaved = state.savedNoteIds.includes(note.id);
  const isDownloaded = state.downloadedNoteIds.includes(note.id);

  const authorInitials = note.authorName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden flex flex-col justify-between shadow-2xs group">
      <div>
        {/* Clean Cover Photograph */}
        <div
          onClick={() => setSelectedNoteId(note.id)}
          className="relative aspect-16/10 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
        >
          {!coverFailed && note.coverImage ? (
            <img
              src={note.coverImage}
              alt={note.title}
              referrerPolicy="no-referrer"
              onError={() => setCoverFailed(true)}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
              <FileText className="w-10 h-10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-slate-950/60 to-transparent pointer-events-none" />
          <div className="absolute top-2.5 right-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveNote(note.id);
              }}
              aria-label={isSaved ? 'Remove bookmark' : 'Save note'}
              className={`p-2 rounded-xl backdrop-blur-md border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-semibold text-white/95">
            <span className="truncate">{note.format}</span>
            <span className="tabular-nums shrink-0">{note.pagesCount} pages</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {/* Quiet unboxed inline metadata (no static pill badges) */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
            <span className="text-blue-600 dark:text-blue-400 truncate">
              {note.course}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
              +{note.karmaReward} Karma
            </span>
          </div>

          <h3
            onClick={() => setSelectedNoteId(note.id)}
            className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {note.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {note.summary}
          </p>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {note.subjectArea} · {note.semesterOrTerm} · {note.level}
          </div>

          {/* Author Line */}
          <div className="flex items-center gap-2.5 pt-1">
            {!avatarFailed && note.authorAvatar ? (
              <img
                src={note.authorAvatar}
                alt={note.authorName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                {authorInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                <span className="truncate">
                  {note.authorName}
                  {note.isOwnUpload ? ' (You)' : ''}
                </span>
                {note.isVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {note.authorCollege} · {note.dateLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{note.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({note.reviews.length})</span>
          </span>
          <span className="text-slate-400 text-[11px]">
            {note.downloads} downloads
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedNoteId(note.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Read</span>
          </button>
          <button
            type="button"
            onClick={() => downloadNote(note)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              isDownloaded
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloaded ? 'Saved' : 'Get'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
