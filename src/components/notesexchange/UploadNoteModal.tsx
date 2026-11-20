import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { useNotesExchange } from '../../context/NotesExchangeContext';
import {
  NoteEducationLevel,
  NoteFormat,
  SharedNoteAttachment,
} from '../../types/notesExchange';
import { useAuth } from '../../context/AuthContext';

const FORMAT_OPTIONS: NoteFormat[] = [
  'Handwritten PDF',
  'Digital Notes',
  'Formula Sheet',
  'Lecture Summary',
  'PYQ Solutions',
];

const LEVEL_OPTIONS: NoteEducationLevel[] = [
  'Undergraduate',
  'Class 11–12',
  'Postgraduate',
  'Competitive Exam',
];

export const UploadNoteModal: React.FC = () => {
  const { profile } = useAuth();
  const {
    isUploadModalOpen,
    closeUploadModal,
    pendingDraft,
    publishNote,
    getStudyHubPersonalNotes,
    showToast,
  } = useNotesExchange();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('CS-302 (Algorithms)');
  const [subjectArea, setSubjectArea] = useState('Computer Science');
  const [semesterOrTerm, setSemesterOrTerm] = useState(
    profile.semester || 'Semester 6'
  );
  const [level, setLevel] = useState<NoteEducationLevel>('Undergraduate');
  const [format, setFormat] = useState<NoteFormat>('Digital Notes');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [pagesCount, setPagesCount] = useState(10);
  const [attachment, setAttachment] = useState<SharedNoteAttachment | undefined>(
    undefined
  );
  const [studyHubImportOpen, setStudyHubImportOpen] = useState(false);

  useEffect(() => {
    if (!isUploadModalOpen) return;
    if (pendingDraft) {
      setTitle(pendingDraft.title || '');
      setCourse(pendingDraft.course || 'CS-302 (Algorithms)');
      setContent(pendingDraft.content || '');
      if (pendingDraft.source === 'ai') {
        setFormat('Lecture Summary');
        setSummary(
          'Structured AI-assisted study notes reviewed and published for peer revision.'
        );
      }
    } else {
      setTitle('');
      setCourse('CS-302 (Algorithms)');
      setSubjectArea('Computer Science');
      setSemesterOrTerm(profile.semester || 'Semester 6');
      setLevel('Undergraduate');
      setFormat('Handwritten PDF');
      setSummary('');
      setContent('');
      setTagsRaw('');
      setPagesCount(10);
      setAttachment(undefined);
    }
    setStudyHubImportOpen(false);
  }, [isUploadModalOpen, pendingDraft, profile.semester]);

  if (!isUploadModalOpen) return null;

  const studyHubNotes = getStudyHubPersonalNotes();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('Please attach a file smaller than 4 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      setAttachment({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        dataUrl: resultStr,
      });

      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ''));
      }

      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.txt')
      ) {
        const textReader = new FileReader();
        textReader.onload = () => {
          if (typeof textReader.result === 'string') {
            setContent(textReader.result);
          }
        };
        textReader.readAsText(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportFromStudyHub = (noteId: string) => {
    const found = studyHubNotes.find((n) => n.id === noteId);
    if (!found) return;
    setTitle(found.title);
    setSummary(found.description || '');
    setContent(found.content);
    setFormat('Digital Notes');
    setStudyHubImportOpen(false);
    showToast(`Imported "${found.title}" from Study Hub`, 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!content.trim() && !attachment)) {
      showToast('Add a title plus note text or an attached study file.', 'warning');
      return;
    }

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    publishNote({
      title,
      course,
      subjectArea,
      semesterOrTerm,
      level,
      format,
      summary,
      content:
        content.trim() ||
        `Attached study file: **${attachment?.fileName}**.\n\nDownload the verified peer resource above to view all pages.`,
      tags,
      pagesCount,
      attachment,
      fulfillRequestId: pendingDraft?.fulfillRequestId,
    });
  };

  const bonusKarma = pendingDraft?.bountyKarma || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-note-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2
              id="upload-note-title"
              className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100"
            >
              Publish Study Note
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Earn +100 Base Karma{bonusKarma > 0 ? ` + ${bonusKarma} Bounty Karma` : ''} upon publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={closeUploadModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close upload modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {pendingDraft?.source === 'ai' && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Draft imported from <strong>KAMPUS AI Notes Generator</strong>. Review and publish to share with classmates.
              </span>
            </div>
          )}

          {pendingDraft?.fulfillRequestId && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 text-xs text-amber-950 dark:text-amber-200">
              <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Fulfilling peer request · Publishing awards <strong>+{100 + bonusKarma} Total Karma</strong>!
              </span>
            </div>
          )}

          {/* Import from Study Hub quick toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <button
              type="button"
              onClick={() => setStudyHubImportOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {studyHubImportOpen
                  ? 'Hide Study Hub Personal Notes'
                  : `Import from Study Hub Notes (${studyHubNotes.length})`}
              </span>
            </button>
          </div>

          {studyHubImportOpen && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 max-h-40 overflow-y-auto">
              {studyHubNotes.length === 0 ? (
                <p className="text-xs text-slate-400">No personal notes found in Study Hub.</p>
              ) : (
                studyHubNotes.map((sn) => (
                  <button
                    key={sn.id}
                    type="button"
                    onClick={() => handleImportFromStudyHub(sn.id)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-blue-500 flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {sn.title}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                      Load Note
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dynamic Programming on DAGs & Bitmask DP Complete Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course Code & Name *
              </label>
              <input
                type="text"
                required
                placeholder="CS-302 (Algorithms)"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Area
              </label>
              <input
                type="text"
                placeholder="Computer Science / Mathematics / Physics"
                value={subjectArea}
                onChange={(e) => setSubjectArea(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Education Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as NoteEducationLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as NoteFormat)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester / Class
              </label>
              <input
                type="text"
                value={semesterOrTerm}
                onChange={(e) => setSemesterOrTerm(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Pages
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={pagesCount}
                onChange={(e) => setPagesCount(Number(e.target.value) || 1)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              One-line Summary
            </label>
            <input
              type="text"
              placeholder="Briefly explain what chapters or exam topics this covers..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Study Note Body (Markdown supported)
            </label>
            <textarea
              rows={5}
              placeholder="# Key Concepts&#10;- Write derivations, definitions, or paste structured notes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Trees, Recurrences, Mid-Sem, GATE"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* File Attachment */}
          <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 text-center space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.txt,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            {attachment ? (
              <div className="flex items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-lg">
                <span className="inline-flex items-center gap-1.5 font-semibold truncate">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{attachment.fileName}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachment(undefined)}
                  className="text-slate-500 hover:text-rose-600 font-semibold shrink-0 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Optional: Attach scanned PDF, Markdown, or image sheet (Max 4 MB)
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                </button>
              </>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeUploadModal}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
            >
              Publish Note (+{100 + bonusKarma} Karma)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
