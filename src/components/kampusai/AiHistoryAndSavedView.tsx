import React, { useState } from 'react';
import {
  History,
  Bookmark,
  Search,
  Trash2,
  Edit3,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import {
  AiHistoryCategory,
  AiLanguage,
  AiLearningLevel,
  AiResponseStyle,
  SavedCollectionName,
} from '../../types/kampusAi';

const HISTORY_TABS: Array<'All' | AiHistoryCategory> = [
  'All',
  'Conversations',
  'Generated Notes',
  'Quizzes',
  'Flashcards',
  'Solved Questions',
  'PDF Summaries',
  'Study Plans',
  'Explanations',
];

const SAVED_COLLECTIONS: SavedCollectionName[] = [
  'All',
  'Explanations',
  'Conversations',
  'Notes',
  'Quiz Results',
  'Flashcards',
  'Solutions',
  'Summaries',
  'Study Plans',
];

interface AiHistoryAndSavedViewProps {
  mode: 'history' | 'saved';
}

export const AiHistoryAndSavedView: React.FC<AiHistoryAndSavedViewProps> = ({ mode }) => {
  const {
    history,
    reopenHistoryEntry,
    renameHistoryEntry,
    deleteHistoryEntry,
    savedItems,
    removeSavedItem,
    launchToolWithPrefill,
    setActiveConversationId,
    setActiveTool,
    preferences,
    updatePreferences,
    serviceStatus,
    refreshStatus,
    statusLoading,
  } = useKampusAi();

  const [search, setSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'All' | AiHistoryCategory>('All');
  const [savedFilter, setSavedFilter] = useState<SavedCollectionName>('All');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const filteredHistory = history.filter((h) => {
    const matchesTab = historyFilter === 'All' || h.category === historyFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || h.title.toLowerCase().includes(q) || h.subtitle.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const filteredSaved = savedItems.filter((s) => {
    const matchesCol = savedFilter === 'All' || s.collection === savedFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q);
    return matchesCol && matchesSearch;
  });

  const handleOpenSaved = (item: (typeof savedItems)[0]) => {
    if (item.toolId === 'chat' && item.data?.id) {
      setActiveConversationId(item.data.id);
      setActiveTool('chat');
      return;
    }
    launchToolWithPrefill(item.toolId, item.data);
  };

  return (
    <div className="space-y-6">
      {/* Main History / Saved List Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              {mode === 'history' ? <History className="w-5 h-5" /> : <Bookmark className="w-5 h-5 text-orange-500" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {mode === 'history' ? 'My AI History' : 'Saved & Favorites'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'history'
                  ? 'Reopen, rename, or manage conversations, notes, quizzes, flashcards, and study plans.'
                  : 'Quick-access collections of your bookmarked explanations, solutions, notes, and decks.'}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === 'history' ? 'Search AI history...' : 'Search saved items...'}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {mode === 'history'
            ? HISTORY_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setHistoryFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    historyFilter === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))
            : SAVED_COLLECTIONS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSavedFilter(col)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    savedFilter === col
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {col}
                </button>
              ))}
        </div>

        {/* Results Grid */}
        {mode === 'history' ? (
          filteredHistory.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
              No AI activity entries match this filter yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-orange-500">{item.category}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-400 tabular-nums">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {renamingId === item.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onBlur={() => {
                          renameHistoryEntry(item.id, renameText);
                          setRenamingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameHistoryEntry(item.id, renameText);
                            setRenamingId(null);
                          }
                        }}
                        className="mt-1 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-blue-500 text-xs sm:text-sm w-full max-w-md"
                      />
                    ) : (
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                        {item.title}
                      </h4>
                    )}
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => reopenHistoryEntry(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(item.id);
                        setRenameText(item.title);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 cursor-pointer"
                      title="Rename"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHistoryEntry(item.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredSaved.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
            No saved items in this collection yet. Use the Save button inside any KAMPUS AI tool to bookmark outputs here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSaved.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-orange-500">{item.collection}</span>
                    <span className="text-slate-400 tabular-nums">
                      {new Date(item.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.summary}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenSaved(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Tool</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSavedItem(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personalization & AI Service Availability Status Panel (Sections 12 & 15) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              AI Personalization Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Default Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreferences({ language: e.target.value as AiLanguage })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Learning Level
              </label>
              <select
                value={preferences.learningLevel}
                onChange={(e) =>
                  updatePreferences({ learningLevel: e.target.value as AiLearningLevel })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Response Style
              </label>
              <select
                value={preferences.responseStyle}
                onChange={(e) =>
                  updatePreferences({ responseStyle: e.target.value as AiResponseStyle })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="Simple Explanation">Simple Explanation</option>
                <option value="Detailed Explanation">Detailed Explanation</option>
                <option value="Exam-Oriented Answer">Exam-Oriented Answer</option>
                <option value="Short Revision Answer">Short Revision Answer</option>
                <option value="Beginner-Friendly Explanation">Beginner-Friendly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              AI Service Availability & Upload Limits
            </h3>
            <button
              type="button"
              onClick={refreshStatus}
              disabled={statusLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${statusLoading ? 'animate-spin' : ''}`} />
              <span>Recheck</span>
            </button>
          </div>

          {serviceStatus && (
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-semibold">
                {serviceStatus.available ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
                )}
                <span>{serviceStatus.message}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500">
                <div>Provider: {serviceStatus.provider}</div>
                <div>Model: {serviceStatus.model}</div>
                <div>Max Upload: 10 MB per file</div>
                <div>Formats: {serviceStatus.supportedFormats.join(', ')}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
