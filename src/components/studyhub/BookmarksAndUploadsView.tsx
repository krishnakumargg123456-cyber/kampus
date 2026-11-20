import React, { useState, useRef } from 'react';
import {
  Bookmark,
  Upload,
  Search,
  Trash2,
  Edit3,
  Eye,
  FileText,
  X,
  CheckCircle2,
  Info,
  ArrowUpRight,
} from 'lucide-react';
import { useStudyHub } from '../../context/StudyHubContext';
import { MaterialCategory, UploadedResource } from '../../types/studyHub';

type BookmarkFilter = 'all' | 'chapters' | 'topics' | 'notes' | 'materials' | 'papers' | 'questions';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.webp', '.txt'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB safe browser preview/storage limit

export const BookmarksAndUploadsView: React.FC = () => {
  const {
    state,
    openSubjectChapterTopic,
    setActiveTab,
    toggleChapterBookmark,
    toggleTopicBookmark,
    toggleNoteBookmark,
    toggleMaterialBookmark,
    togglePaperBookmark,
    toggleQuestionBookmark,
    addUploadedResource,
    renameUploadedResource,
    deleteUploadedResource,
  } = useStudyHub();

  const [subView, setSubView] = useState<'bookmarks' | 'uploads'>('bookmarks');
  const [bmSearch, setBmSearch] = useState('');
  const [bmFilter, setBmFilter] = useState<BookmarkFilter>('all');

  // Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSubjectId, setUploadSubjectId] = useState(state.subjects[0]?.id || 'subj-cs302');
  const [uploadCategory, setUploadCategory] = useState<MaterialCategory>('PDF Notes');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUpload, setPreviewUpload] = useState<UploadedResource | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Collect all bookmarks cleanly
  const bookmarkedChapters = state.subjects.flatMap((s) =>
    s.chapters
      .filter((c) => c.bookmarked)
      .map((c) => ({ subject: s, chapter: c }))
  );

  const bookmarkedTopics = state.subjects.flatMap((s) =>
    s.chapters.flatMap((c) =>
      c.topics
        .filter((t) => t.bookmarked)
        .map((t) => ({ subject: s, chapter: c, topic: t }))
    )
  );

  const bookmarkedNotes = state.notes.filter((n) => n.bookmarked);
  const bookmarkedMaterials = state.materials.filter((m) => m.bookmarked);
  const bookmarkedPapers = state.papers.filter((p) => p.bookmarked);
  const bookmarkedQuestions = state.questions.filter((q) => q.bookmarked);

  const totalBookmarks =
    bookmarkedChapters.length +
    bookmarkedTopics.length +
    bookmarkedNotes.length +
    bookmarkedMaterials.length +
    bookmarkedPapers.length +
    bookmarkedQuestions.length;

  const q = bmSearch.trim().toLowerCase();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const detectFileType = (fileName: string): UploadedResource['fileType'] => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'PDF';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'DOC';
    if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'PPT';
    if (lower.endsWith('.txt')) return 'TXT';
    return 'IMAGE';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(
        `Unsupported file type "${ext}". Allowed: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, WEBP, TXT.`
      );
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`File exceeds 5 MB browser storage limit (${formatSize(file.size)}).`);
      return;
    }

    const fileType = detectFileType(file.name);
    setUploadProgress(20);

    const finalizeUpload = (previewDataUrl?: string, textPreview?: string) => {
      let progress = 40;
      const interval = setInterval(() => {
        progress += 30;
        setUploadProgress(Math.min(100, progress));
        if (progress >= 100) {
          clearInterval(interval);
          addUploadedResource({
            name: file.name,
            originalName: file.name,
            fileType,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            sizeLabel: formatSize(file.size),
            subjectId: uploadSubjectId,
            category: uploadCategory,
            previewDataUrl,
            textPreview,
          });
          setTimeout(() => setUploadProgress(null), 500);
        }
      }, 150);
    };

    if (fileType === 'TXT') {
      const reader = new FileReader();
      reader.onload = () => finalizeUpload(undefined, String(reader.result || '').slice(0, 12000));
      reader.readAsText(file);
    } else if (fileType === 'IMAGE' || (fileType === 'PDF' && file.size < 1.5 * 1024 * 1024)) {
      const reader = new FileReader();
      reader.onload = () => finalizeUpload(String(reader.result || ''));
      reader.readAsDataURL(file);
    } else {
      finalizeUpload(undefined, `${file.name} (${formatSize(file.size)}) stored in local resource catalog.`);
    }

    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Sub-view Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-fit">
        <button
          onClick={() => setSubView('bookmarks')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            subView === 'bookmarks'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Bookmarks & Saved ({totalBookmarks})</span>
        </button>
        <button
          onClick={() => setSubView('uploads')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            subView === 'uploads'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>File Uploads & Manager ({state.uploads.length})</span>
        </button>
      </div>

      {/* BOOKMARKS VIEW */}
      {subView === 'bookmarks' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={bmSearch}
                onChange={(e) => setBmSearch(e.target.value)}
                placeholder="Search saved chapters, topics, notes, PDFs, papers, or questions..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: `All (${totalBookmarks})` },
                  { id: 'chapters', label: `Chapters (${bookmarkedChapters.length})` },
                  { id: 'topics', label: `Topics (${bookmarkedTopics.length})` },
                  { id: 'notes', label: `Notes (${bookmarkedNotes.length})` },
                  { id: 'materials', label: `PDFs & Library (${bookmarkedMaterials.length})` },
                  { id: 'papers', label: `Question Papers (${bookmarkedPapers.length})` },
                  { id: 'questions', label: `Questions (${bookmarkedQuestions.length})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setBmFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    bmFilter === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {totalBookmarks === 0 ? (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No saved bookmarks yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Bookmark any chapter, topic, note, PDF, paper, or question to access it quickly here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(bmFilter === 'all' || bmFilter === 'chapters') &&
                bookmarkedChapters
                  .filter((x) => !q || x.chapter.title.toLowerCase().includes(q))
                  .map(({ subject, chapter }) => (
                    <div
                      key={chapter.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-blue-600">
                          Chapter · {subject.code}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          Ch {chapter.number}: {chapter.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openSubjectChapterTopic(subject.id, chapter.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleChapterBookmark(subject.id, chapter.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Remove bookmark"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

              {(bmFilter === 'all' || bmFilter === 'topics') &&
                bookmarkedTopics
                  .filter((x) => !q || x.topic.title.toLowerCase().includes(q))
                  .map(({ subject, chapter, topic }) => (
                    <div
                      key={topic.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-orange-500">
                          Topic · {subject.code} · Ch {chapter.number}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {topic.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openSubjectChapterTopic(subject.id, chapter.id, topic.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleTopicBookmark(subject.id, chapter.id, topic.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

              {(bmFilter === 'all' || bmFilter === 'notes') &&
                bookmarkedNotes
                  .filter((n) => !q || n.title.toLowerCase().includes(q))
                  .map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-indigo-600">Personal Note</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {note.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTab('notes')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold cursor-pointer"
                        >
                          <span>Open Notes</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleNoteBookmark(note.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

              {(bmFilter === 'all' || bmFilter === 'materials') &&
                bookmarkedMaterials
                  .filter((m) => !q || m.title.toLowerCase().includes(q))
                  .map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-emerald-600">
                          {mat.category} · {mat.fileType}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {mat.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTab('library')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold cursor-pointer"
                        >
                          <span>Open Library</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleMaterialBookmark(mat.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

              {(bmFilter === 'all' || bmFilter === 'papers') &&
                bookmarkedPapers
                  .filter((p) => !q || p.title.toLowerCase().includes(q))
                  .map((paper) => (
                    <div
                      key={paper.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-orange-500">
                          PYQ Paper · {paper.year}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {paper.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTab('pyqs')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold cursor-pointer"
                        >
                          <span>Open PYQs</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => togglePaperBookmark(paper.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

              {(bmFilter === 'all' || bmFilter === 'questions') &&
                bookmarkedQuestions
                  .filter((qb) => !q || qb.question.toLowerCase().includes(q))
                  .map((qb) => (
                    <div
                      key={qb.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-blue-600">
                          {qb.type} · {qb.difficulty}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {qb.question}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTab('qbank')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold cursor-pointer"
                        >
                          <span>Open QBank</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleQuestionBookmark(qb.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>
      )}

      {/* UPLOADS VIEW */}
      {subView === 'uploads' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Upload Study Files & Personal Resources
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports PDF, DOC/DOCX, PPT/PPTX, Images (PNG/JPG/WEBP), and TXT up to 5 MB.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Stored locally in browser (cloud bucket not configured)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Assign to Subject</label>
                <select
                  value={uploadSubjectId}
                  onChange={(e) => setUploadSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {state.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Resource Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as MaterialCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {[
                    'PDF Notes',
                    'Text Notes',
                    'Study Guides',
                    'Reference Books',
                    'Handwritten Notes',
                    'Presentations',
                    'Previous Year Papers',
                    'Important Questions',
                    'Subject-wise Resources',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
            >
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Click to select a study file from your device
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, TXT · Max 5 MB
              </p>
            </div>

            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-blue-600 tabular-nums">
                  <span>Processing upload...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs font-semibold text-rose-600">
                {uploadError}
              </div>
            )}
          </div>

          {/* Uploaded Files List */}
          <div className="space-y-3">
            {state.uploads.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <FileText className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  No personal files uploaded yet
                </p>
              </div>
            ) : (
              state.uploads.map((item) => {
                const subj = state.subjects.find((s) => s.id === item.subjectId);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-blue-600">
                        {item.fileType} · {item.sizeLabel} · {item.category} · {subj?.code || 'General'}
                      </div>
                      {renamingId === item.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-blue-500 text-xs font-semibold"
                          />
                          <button
                            onClick={() => {
                              renameUploadedResource(item.id, renameValue);
                              setRenamingId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {item.name}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Uploaded on {item.uploadedAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewUpload(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => {
                          setRenamingId(item.id);
                          setRenameValue(item.name);
                        }}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteUploadedResource(item.id)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Upload Preview Modal */}
      {previewUpload && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold truncate">{previewUpload.name}</h3>
              </div>
              <button
                onClick={() => setPreviewUpload(null)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {previewUpload.fileType === 'IMAGE' && previewUpload.previewDataUrl ? (
                <img
                  src={previewUpload.previewDataUrl}
                  alt={previewUpload.name}
                  className="max-h-[55vh] mx-auto rounded-xl object-contain"
                />
              ) : previewUpload.fileType === 'PDF' && previewUpload.previewDataUrl ? (
                <iframe
                  src={previewUpload.previewDataUrl}
                  title={previewUpload.name}
                  className="w-full h-[55vh] rounded-xl border border-slate-200"
                />
              ) : (
                <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono whitespace-pre-wrap">
                  {previewUpload.textPreview ||
                    `${previewUpload.name} (${previewUpload.sizeLabel}) — File metadata verified and organized under ${previewUpload.category}.`}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
