import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Filter,
  HelpCircle,
  Sparkles,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  NotesExchangeProvider,
  useNotesExchange,
} from '../../context/NotesExchangeContext';
import { NOTES_EXCHANGE_IMAGES } from '../../data/notesExchangeData';
import {
  NoteEducationLevel,
  NoteFormat,
  NotesSortOption,
} from '../../types/notesExchange';
import { NotesExchangeHeader } from '../../components/notesexchange/NotesExchangeHeader';
import { NoteCard } from '../../components/notesexchange/NoteCard';
import { NoteDetailModal } from '../../components/notesexchange/NoteDetailModal';
import { UploadNoteModal } from '../../components/notesexchange/UploadNoteModal';
import { NoteRequestsView } from '../../components/notesexchange/NoteRequestsView';
import { MyContributionsView } from '../../components/notesexchange/MyContributionsView';

interface NotesExchangePageProps {
  onOpenNotifications?: () => void;
}

const FORMAT_FILTERS: Array<NoteFormat | 'All'> = [
  'All',
  'Handwritten PDF',
  'Digital Notes',
  'Formula Sheet',
  'Lecture Summary',
  'PYQ Solutions',
];

const LEVEL_FILTERS: Array<NoteEducationLevel | 'All'> = [
  'All',
  'Undergraduate',
  'Class 11–12',
  'Postgraduate',
  'Competitive Exam',
];

const NotesExchangeWorkspace: React.FC<NotesExchangePageProps> = ({
  onOpenNotifications,
}) => {
  const navigate = useNavigate();
  const {
    state,
    activeTab,
    setActiveTab,
    openUploadModal,
    toastMessage,
    dismissToast,
  } = useNotesExchange();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<NoteFormat | 'All'>('All');
  const [selectedLevel, setSelectedLevel] = useState<NoteEducationLevel | 'All'>('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<NotesSortOption>('top-rated');

  const subjectAreas = useMemo(() => {
    const unique = Array.from(new Set(state.notes.map((n) => n.subjectArea)));
    return ['All', ...unique];
  }, [state.notes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = state.notes.filter((n) => {
      if (selectedSubject !== 'All' && n.subjectArea !== selectedSubject) {
        return false;
      }
      if (selectedFormat !== 'All' && n.format !== selectedFormat) {
        return false;
      }
      if (selectedLevel !== 'All' && n.level !== selectedLevel) {
        return false;
      }
      if (verifiedOnly && !n.isVerified) {
        return false;
      }
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.course.toLowerCase().includes(q) ||
        n.subjectArea.toLowerCase().includes(q) ||
        n.authorName.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'most-downloaded') return b.downloads - a.downloads;
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.rating - a.rating || b.downloads - a.downloads;
    });
  }, [
    state.notes,
    searchQuery,
    selectedSubject,
    selectedFormat,
    selectedLevel,
    verifiedOnly,
    sortBy,
  ]);

  const savedNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.notes.filter((n) => {
      if (!state.savedNoteIds.includes(n.id)) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.course.toLowerCase().includes(q) ||
        n.authorName.toLowerCase().includes(q)
      );
    });
  }, [state.notes, state.savedNoteIds, searchQuery]);

  const openBountiesCount = state.requests.filter((r) => r.status === 'open').length;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSubject !== 'All' ||
    selectedFormat !== 'All' ||
    selectedLevel !== 'All' ||
    verifiedOnly;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('All');
    setSelectedFormat('All');
    setSelectedLevel('All');
    setVerifiedOnly(false);
  };

  return (
    <div className="space-y-6">
      <NotesExchangeHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border flex items-center justify-between gap-3 text-xs font-semibold ${
            toastMessage.tone === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              : toastMessage.tone === 'info'
              ? 'bg-slate-900 dark:bg-slate-800 border-slate-700 text-white'
              : 'bg-emerald-600 border-emerald-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="opacity-80 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* EXPLORE TAB */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Editorial Hero Strip */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  Verified Peer Knowledge Network
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                  Share handwritten lecture notes, earn Karma, and revise faster together.
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                  Save any peer note directly into your Study Hub workspace or launch KAMPUS AI to generate practice quizzes from verified class notes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => openUploadModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Share Notes (+100 Karma)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-orange-500" />
                  <span>Open Bounties ({openBountiesCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/learn/kampus-ai')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Notes with AI</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-48 lg:min-h-full bg-slate-100 dark:bg-slate-800">
              <img
                src={NOTES_EXCHANGE_IMAGES.heroBanner}
                alt="Students collaborating and exchanging handwritten lecture notes in library"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-slate-950/80 via-slate-950/35 to-transparent text-white flex items-center justify-between text-xs">
                <span className="font-semibold inline-flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="tabular-nums">
                    {state.karmaPoints.toLocaleString()} Karma Earned
                  </span>
                </span>
                <span className="text-slate-200 tabular-nums">
                  {state.notes.length} Verified Packs
                </span>
              </div>
            </div>
          </section>

          {/* Filter & Sort Controls */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Filter Library</span>
                <span className="text-slate-400 font-normal tabular-nums">
                  · Showing {filteredNotes.length} of {state.notes.length} notes
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter by subject area"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  {subjectAreas.map((area) => (
                    <option key={area} value={area}>
                      {area === 'All' ? 'All Subjects' : area}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by education level"
                  value={selectedLevel}
                  onChange={(e) =>
                    setSelectedLevel(e.target.value as NoteEducationLevel | 'All')
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  {LEVEL_FILTERS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl === 'All' ? 'All Levels' : lvl}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Sort notes"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as NotesSortOption)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="top-rated">Sort: Top Rated</option>
                  <option value="most-downloaded">Sort: Most Downloaded</option>
                  <option value="recent">Sort: Most Recent</option>
                </select>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Verified Only</span>
                </label>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Format Segmented Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {FORMAT_FILTERS.map((fmt) => {
                const active = selectedFormat === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                    }`}
                  >
                    {fmt === 'All' ? 'All Formats' : fmt}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                No study notes matched your filters
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Try clearing your filters or post a Syllabus Request so peers from your course can upload these notes for a Karma bounty.
              </p>
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Request This Topic
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* REQUESTS & BOUNTIES TAB */}
      {activeTab === 'requests' && (
        <NoteRequestsView searchQuery={searchQuery} />
      )}

      {/* SAVED NOTES TAB */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedNotes.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
              <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                No bookmarked study notes yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Bookmark peer notes from Explore Notes for quick pre-exam access, or save them straight into Study Hub.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Browse Explore Notes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {savedNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY CONTRIBUTIONS TAB */}
      {activeTab === 'contributions' && <MyContributionsView />}

      {/* Modals */}
      <NoteDetailModal />
      <UploadNoteModal />
    </div>
  );
};

export const NotesExchangePage: React.FC<NotesExchangePageProps> = ({
  onOpenNotifications,
}) => {
  return (
    <NotesExchangeProvider>
      <NotesExchangeWorkspace onOpenNotifications={onOpenNotifications} />
    </NotesExchangeProvider>
  );
};
