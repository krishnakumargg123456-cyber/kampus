import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Bookmark,
  Eye,
  Share2,
  Flag,
  FileText,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudyHub } from '../../context/StudyHubContext';
import { MaterialCategory, StudyMaterialItem } from '../../types/studyHub';

interface StudyLibraryViewProps {
  onOpenAi?: (prompt?: string) => void;
}

const CATEGORIES: Array<'all' | MaterialCategory> = [
  'all',
  'PDF Notes',
  'Text Notes',
  'Study Guides',
  'Reference Books',
  'Handwritten Notes',
  'Presentations',
  'Previous Year Papers',
  'Important Questions',
  'Subject-wise Resources',
];

export const StudyLibraryView: React.FC<StudyLibraryViewProps> = ({ onOpenAi }) => {
  const navigate = useNavigate();
  const {
    state,
    libraryInitialCategory,
    setLibraryInitialCategory,
    toggleMaterialBookmark,
    incrementMaterialDownload,
    reportMaterial,
  } = useStudyHub();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | MaterialCategory>(
    libraryInitialCategory
  );
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'title'>('recent');

  const [previewItem, setPreviewItem] = useState<StudyMaterialItem | null>(null);
  const [reportItem, setReportItem] = useState<StudyMaterialItem | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory(libraryInitialCategory);
  }, [libraryInitialCategory]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const uniqueSemesters = ['all', ...Array.from(new Set(state.materials.map((m) => m.semester)))];

  const filtered = state.materials
    .filter((m) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.subjectName.toLowerCase().includes(q) ||
        m.chapterName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchesSubj = subjectFilter === 'all' || m.subjectId === subjectFilter;
      const matchesSem = semesterFilter === 'all' || m.semester === semesterFilter;
      return matchesSearch && matchesCat && matchesSubj && matchesSem;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.downloads - a.downloads;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return b.uploadDate.localeCompare(a.uploadDate);
    });

  const handleDownload = (item: StudyMaterialItem) => {
    const content = `${item.title}\nSubject: ${item.subjectName}\nChapter: ${item.chapterName}\nCategory: ${item.category}\nSource: ${item.uploadedBy}\n\n${item.description}\n\n---\n${item.previewContent}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    incrementMaterialDownload(item.id);
    showToast(`Downloaded "${item.title}" summary sheet`);
  };

  const handleShare = async (item: StudyMaterialItem) => {
    const shareText = `KAMPUS Study Hub Resource: ${item.title} (${item.subjectName} · ${item.category})`;
    try {
      await navigator.clipboard.writeText(shareText);
      showToast('Resource details copied to clipboard');
    } catch {
      showToast('Ready to share: ' + item.title);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportItem || !reportReason.trim()) return;
    reportMaterial(reportItem.id, reportReason.trim());
    setReportItem(null);
    setReportReason('');
    showToast('Report recorded locally for academic review.');
  };

  return (
    <div className="space-y-5">
      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Search, Filters & Sort */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Study Material Library
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Curated sample lecture notes, reference guides, handwritten sheets, and important questions.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500 tabular-nums">
            Showing {filtered.length} of {state.materials.length} resources
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, chapter, or keyword..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="md:col-span-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="all">All Subjects</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            {uniqueSemesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem === 'all' ? 'All Semesters' : sem}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'title')}
            className="md:col-span-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="recent">Recently Uploaded</option>
            <option value="popular">Most Popular</option>
            <option value="title">Title (A–Z)</option>
          </select>
        </div>

        {/* 9 Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setLibraryInitialCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Material Types' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No study materials match these filters
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setSubjectFilter('all');
              setSemesterFilter('all');
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                  <span className="text-blue-600 dark:text-blue-400">
                    {item.category} · {item.fileType} · {item.fileSize}
                  </span>
                  <span className="text-slate-400 tabular-nums">{item.uploadDate}</span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>

                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {item.subjectName} · <span className="text-slate-400">Ch: {item.chapterName}</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span>{item.uploadedBy}</span>
                  <span>·</span>
                  <span className="tabular-nums">{item.pages} pages</span>
                  <span>·</span>
                  <span className="tabular-nums">{item.downloads} downloads</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMaterialBookmark(item.id)}
                    className={`p-2 rounded-xl border cursor-pointer ${
                      item.bookmarked
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 text-orange-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-orange-500'
                    }`}
                    title="Bookmark"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${item.bookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleShare(item)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setReportItem(item)}
                    className={`p-2 rounded-xl border cursor-pointer ${
                      item.reportedReason
                        ? 'border-rose-200 text-rose-500 bg-rose-50'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500'
                    }`}
                    title="Report incorrect material"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-blue-600 uppercase">
                  {previewItem.category} · {previewItem.fileType}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {previewItem.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-xs text-slate-500">
                {previewItem.subjectName} · {previewItem.chapterName} · Uploaded by{' '}
                {previewItem.uploadedBy}
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {previewItem.previewContent}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {onOpenAi && (
                  <button
                    onClick={() => {
                      const title = previewItem.title;
                      setPreviewItem(null);
                      onOpenAi(`Summarize the key takeaways from "${title}"`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Summarize with KAMPUS AI</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    localStorage.setItem(
                      'kampus_ai_handoff_v1',
                      JSON.stringify({
                        toolId: 'quiz',
                        payload: {
                          subject: previewItem.subjectName,
                          chapter: previewItem.chapterName,
                          topic: previewItem.title,
                        },
                      })
                    );
                    setPreviewItem(null);
                    navigate('/learn/kampus-ai');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Quiz in KAMPUS AI</span>
                </button>
              </div>
              <button
                onClick={() => handleDownload(previewItem)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer ml-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Study Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Report Incorrect Material
              </h3>
              <button
                onClick={() => setReportItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Flagging: <span className="font-semibold text-slate-800 dark:text-slate-200">{reportItem.title}</span>
            </p>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <textarea
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe incorrect formula, outdated syllabus, or missing pages..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportItem(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
