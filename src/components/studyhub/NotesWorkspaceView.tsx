import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Pin,
  Bookmark,
  Trash2,
  Bold,
  Italic,
  Heading2,
  List,
  Code,
  Eye,
  Edit3,
  CheckCircle2,
  StickyNote,
} from 'lucide-react';
import { useStudyHub } from '../../context/StudyHubContext';

export const NotesWorkspaceView: React.FC = () => {
  const {
    state,
    createNote,
    updateNote,
    deleteNote,
    toggleNotePin,
    toggleNoteBookmark,
  } = useStudyHub();

  const [selectedNoteId, setSelectedNoteId] = useState<string>(state.notes[0]?.id || '');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Autosaving...'>('Saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredNotes = state.notes
    .filter((n) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q);
      const matchesSubj = subjectFilter === 'all' || n.subjectId === subjectFilter;
      const matchesPinned = !onlyPinned || n.pinned;
      return matchesSearch && matchesSubj && matchesPinned;
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const activeNote =
    state.notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null;

  const handleCreate = () => {
    const defaultSubj = subjectFilter !== 'all' ? subjectFilter : state.subjects[0]?.id || 'subj-cs302';
    const newId = createNote({
      title: 'New Study Note',
      description: 'Quick summary & exam key points',
      content: '## Key Points\n\n- Start writing your formatted study notes here...',
      subjectId: defaultSubj,
    });
    setSelectedNoteId(newId);
    setIsPreviewMode(false);
  };

  const handleFieldUpdate = (updates: Partial<{ title: string; description: string; content: string; subjectId: string }>) => {
    if (!activeNote) return;
    setSaveStatus('Autosaving...');
    updateNote(activeNote.id, updates);
    setTimeout(() => setSaveStatus('Saved'), 450);
  };

  const applyFormat = (prefix: string, suffix: string = '') => {
    if (!activeNote || !textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = activeNote.content.slice(start, end) || 'text';
    const nextContent =
      activeNote.content.slice(0, start) + prefix + selected + suffix + activeNote.content.slice(end);
    handleFieldUpdate({ content: nextContent });
  };

  const renderFormattedContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h4 key={i} className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-3 mb-1">
            {line.replace('## ', '')}
          </h4>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h3 key={i} className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-3 mb-1">
            {line.replace('# ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 list-disc text-xs sm:text-sm text-slate-700 dark:text-slate-200 my-0.5">
            {line.replace('- ', '')}
          </li>
        );
      }
      if (line.startsWith('```')) {
        return null;
      }
      return (
        <p key={i} className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed my-1">
          {line || '\u00A0'}
        </p>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Sidebar: Notes List & Search */}
      <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Personal Notes ({state.notes.length})
          </h2>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search personal notes..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          >
            <option value="all">All Subjects</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOnlyPinned(!onlyPinned)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
              onlyPinned
                ? 'bg-orange-50 border-orange-300 text-orange-600'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
            title="Filter pinned"
          >
            Pinned
          </button>
        </div>

        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {filteredNotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <StickyNote className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
              No matching notes. Create one above!
            </div>
          ) : (
            filteredNotes.map((note) => {
              const subj = state.subjects.find((s) => s.id === note.subjectId);
              const isSelected = activeNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                      {subj?.code || 'GENERAL'}
                    </span>
                    <div className="flex items-center gap-1.5 text-orange-500">
                      {note.pinned && <Pin className="w-3 h-3 fill-current" />}
                      {note.bookmarked && <Bookmark className="w-3 h-3 fill-current" />}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-1">
                    {note.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {note.description || 'No description'}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Note Editor & Formatter */}
      <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col gap-4">
        {!activeNote ? (
          <div className="py-16 text-center space-y-3">
            <StickyNote className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Select a note or create a new study note
            </p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              Create First Note
            </button>
          </div>
        ) : (
          <>
            {/* Top Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <select
                  value={activeNote.subjectId}
                  onChange={(e) => handleFieldUpdate({ subjectId: e.target.value })}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {state.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saveStatus}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {isPreviewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
                </button>
                <button
                  onClick={() => toggleNotePin(activeNote.id)}
                  className={`p-2 rounded-xl border cursor-pointer ${
                    activeNote.pinned
                      ? 'bg-orange-50 border-orange-200 text-orange-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                  title="Pin note"
                >
                  <Pin className={`w-3.5 h-3.5 ${activeNote.pinned ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => toggleNoteBookmark(activeNote.id)}
                  className={`p-2 rounded-xl border cursor-pointer ${
                    activeNote.bookmarked
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                  title="Bookmark note"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${activeNote.bookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => deleteNote(activeNote.id)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleFieldUpdate({ title: e.target.value })}
                placeholder="Note Title..."
                className="w-full text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden"
              />
              <input
                type="text"
                value={activeNote.description}
                onChange={(e) => handleFieldUpdate({ description: e.target.value })}
                placeholder="Short subtitle or topic summary..."
                className="w-full text-xs sm:text-sm text-slate-500 dark:text-slate-400 bg-transparent focus:outline-hidden"
              />
            </div>

            {/* Formatting Toolbar */}
            {!isPreviewMode && (
              <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => applyFormat('**', '**')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('*', '*')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('\n## ', '')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Heading"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('\n- ', '')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Bullet list"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('`', '`')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Code / Formula"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Editor or Preview */}
            {isPreviewMode ? (
              <div className="min-h-[280px] p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                {renderFormattedContent(activeNote.content)}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                rows={12}
                value={activeNote.content}
                onChange={(e) => handleFieldUpdate({ content: e.target.value })}
                placeholder="Write structured study notes, formulas, code snippets, and bullet points..."
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600 leading-relaxed"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
