import React, { useState } from 'react';
import {
  ScrollText,
  Download,
  Eye,
  Bookmark,
  Play,
  Info,
  Upload,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useStudyHub } from '../../context/StudyHubContext';
import { QuestionPaper } from '../../types/studyHub';

export const PyqPapersView: React.FC = () => {
  const { state, togglePaperBookmark, addUploadedPaper, launchPracticeTest } = useStudyHub();

  const [subjectFilter, setSubjectFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [savedOnly, setSavedOnly] = useState(false);

  const [previewPaper, setPreviewPaper] = useState<QuestionPaper | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [upTitle, setUpTitle] = useState('');
  const [upSubjectId, setUpSubjectId] = useState(state.subjects[0]?.id || 'subj-cs302');
  const [upYear, setUpYear] = useState(2025);
  const [upContent, setUpContent] = useState('');

  const uniqueYears = ['all', ...Array.from(new Set(state.papers.map((p) => String(p.year))))];
  const uniqueCourses = ['all', ...Array.from(new Set(state.papers.map((p) => p.course)))];
  const uniqueSemesters = ['all', ...Array.from(new Set(state.papers.map((p) => p.semester)))];

  const filtered = state.papers.filter((p) => {
    const mSubj = subjectFilter === 'all' || p.subjectId === subjectFilter;
    const mYear = yearFilter === 'all' || String(p.year) === yearFilter;
    const mCourse = courseFilter === 'all' || p.course === courseFilter;
    const mSem = semesterFilter === 'all' || p.semester === semesterFilter;
    const mSaved = !savedOnly || p.bookmarked;
    return mSubj && mYear && mCourse && mSem && mSaved;
  });

  const handleDownloadPaper = (paper: QuestionPaper) => {
    const content = `${paper.title}\nCourse: ${paper.course} · ${paper.semester} · Year: ${paper.year}\nDuration: ${paper.durationMinutes} min · Max Marks: ${paper.totalMarks}\n\n${paper.paperTextPreview}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paper.id}_${paper.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upTitle.trim()) return;
    const subj = state.subjects.find((s) => s.id === upSubjectId) || state.subjects[0];
    const subjQuestionIds = state.questions
      .filter((q) => q.subjectId === subj.id)
      .map((q) => q.id);

    addUploadedPaper({
      title: upTitle.trim(),
      subjectId: subj.id,
      subjectName: subj.name,
      course: subj.course,
      semester: subj.semesterOrClass,
      year: upYear,
      examType: 'End-Sem',
      durationMinutes: 90,
      totalMarks: 50,
      fileSize: 'Local Text',
      bookmarked: true,
      isVerifiedSample: false,
      isUserUploaded: true,
      paperTextPreview: upContent.trim() || 'User uploaded question paper archive.',
      questionIds: subjQuestionIds,
    });
    setUpTitle('');
    setUpContent('');
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Honest Archive Notice */}
      <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-slate-200">
            <span className="font-bold">Verified Sample & User Archive:</span> Displays curated sample academic question papers and papers you upload locally. Live institutional exam scraping is not simulated.
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Add Paper Archive</span>
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs grid grid-cols-2 md:grid-cols-5 gap-3">
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium col-span-2 md:col-span-1"
        >
          <option value="all">All Subjects</option>
          {state.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} · {s.name}
            </option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
        >
          {uniqueYears.map((y) => (
            <option key={y} value={y}>
              {y === 'all' ? 'All Years' : y}
            </option>
          ))}
        </select>

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
        >
          {uniqueCourses.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Courses' : c}
            </option>
          ))}
        </select>

        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
        >
          {uniqueSemesters.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Semesters' : s}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSavedOnly(!savedOnly)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
            savedOnly
              ? 'bg-orange-50 border-orange-300 text-orange-600'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {savedOnly ? 'Saved Papers Only ✓' : 'Show Saved Only'}
        </button>
      </div>

      {/* Papers List */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
          <ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No question papers match the selected filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((paper) => {
            const practiceQs =
              paper.questionIds.length > 0
                ? paper.questionIds
                : state.questions.filter((q) => q.subjectId === paper.subjectId).map((q) => q.id);

            return (
              <div
                key={paper.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="text-blue-600 dark:text-blue-400">
                      {paper.year} · {paper.examType}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {paper.course} · {paper.semester}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-emerald-600 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {paper.isUserUploaded ? 'User Uploaded' : 'Verified Sample'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {paper.title}
                  </h3>
                  <div className="text-xs text-slate-500 tabular-nums">
                    {paper.subjectName} · {paper.durationMinutes} mins · {paper.totalMarks} Marks ·{' '}
                    {paper.fileSize}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewPaper(paper)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPaper(paper)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => togglePaperBookmark(paper.id)}
                    className={`p-2 rounded-xl border cursor-pointer ${
                      paper.bookmarked
                        ? 'bg-orange-50 border-orange-200 text-orange-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                    title="Save paper"
                  >
                    <Bookmark className={`w-4 h-4 ${paper.bookmarked ? 'fill-current' : ''}`} />
                  </button>

                  {practiceQs.length > 0 && (
                    <button
                      onClick={() =>
                        launchPracticeTest({
                          title: `PYQ Practice: ${paper.subjectName} (${paper.year})`,
                          mode: 'PYQ Practice',
                          subjectId: paper.subjectId,
                          questionIds: practiceQs,
                          durationMinutes: Math.max(10, practiceQs.length * 3),
                          timed: true,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Practice Mode</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                {previewPaper.title}
              </h3>
              <button
                onClick={() => setPreviewPaper(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[65vh] overflow-y-auto">
              <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {previewPaper.paperTextPreview}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => handleDownloadPaper(previewPaper)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Paper</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Paper Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Add Previous Year Paper to Local Archive
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPaper} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Paper Title *</label>
                <input
                  type="text"
                  required
                  value={upTitle}
                  onChange={(e) => setUpTitle(e.target.value)}
                  placeholder="CS-302 End-Sem Official Paper (2023)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Subject</label>
                  <select
                    value={upSubjectId}
                    onChange={(e) => setUpSubjectId(e.target.value)}
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
                  <label className="block text-xs font-semibold mb-1">Exam Year</label>
                  <input
                    type="number"
                    min={2010}
                    max={2030}
                    value={upYear}
                    onChange={(e) => setUpYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Questions / Transcript</label>
                <textarea
                  rows={4}
                  value={upContent}
                  onChange={(e) => setUpContent(e.target.value)}
                  placeholder="Paste question text or exam instructions..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
