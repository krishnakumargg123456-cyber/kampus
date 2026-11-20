import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  CheckCircle2,
  Circle,
  Bookmark,
  ChevronRight,
  ArrowLeft,
  Edit3,
  Trash2,
  Sparkles,
  FileText,
  ScrollText,
  HelpCircle,
  ClipboardCheck,
  Clock,
  Info,
  X,
  Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudyHub } from '../../context/StudyHubContext';
import { EducationLevel, StudySubject } from '../../types/studyHub';

interface SubjectsExplorerViewProps {
  onOpenAi?: (prompt?: string) => void;
}

const LEVELS: Array<'All' | EducationLevel> = [
  'All',
  'School',
  'Class 11 & 12',
  'Undergraduate',
  'Postgraduate',
  'Competitive Exams',
];

export const SubjectsExplorerView: React.FC<SubjectsExplorerViewProps> = ({ onOpenAi }) => {
  const navigate = useNavigate();
  const {
    state,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedChapterId,
    setSelectedChapterId,
    selectedTopicId,
    setSelectedTopicId,
    addSubject,
    updateSubject,
    deleteSubject,
    toggleChapterComplete,
    toggleChapterBookmark,
    toggleTopicComplete,
    toggleTopicBookmark,
    setReadingPosition,
    updateChapterNotes,
    setActiveTab,
    launchPracticeTest,
  } = useStudyHub();

  const [levelFilter, setLevelFilter] = useState<'All' | EducationLevel>('All');
  const [courseFilter, setCourseFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);

  // Add/Edit form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState<EducationLevel>('Undergraduate');
  const [formCourse, setFormCourse] = useState('B.Tech Computer Science & AI');
  const [formSemester, setFormSemester] = useState('Semester 6');
  const [formDesc, setFormDesc] = useState('');
  const [formChapter, setFormChapter] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  const selectedSubject = state.subjects.find((s) => s.id === selectedSubjectId) || null;
  const selectedChapter =
    selectedSubject?.chapters.find((c) => c.id === selectedChapterId) || null;
  const selectedTopic =
    selectedChapter?.topics.find((t) => t.id === selectedTopicId) ||
    selectedChapter?.topics[0] ||
    null;

  const uniqueCourses = ['All', ...Array.from(new Set(state.subjects.map((s) => s.course)))];

  const filteredSubjects = state.subjects.filter((s) => {
    const matchesLevel = levelFilter === 'All' || s.level === levelFilter;
    const matchesCourse = courseFilter === 'All' || s.course === courseFilter;
    return matchesLevel && matchesCourse;
  });

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormCode('');
    setFormName('');
    setFormLevel('Undergraduate');
    setFormCourse('B.Tech Computer Science & AI');
    setFormSemester('Semester 6');
    setFormDesc('');
    setFormChapter('');
    setShowAddModal(true);
  };

  const openEditModal = (subj: StudySubject) => {
    setEditingSubject(subj);
    setFormCode(subj.code);
    setFormName(subj.name);
    setFormLevel(subj.level);
    setFormCourse(subj.course);
    setFormSemester(subj.semesterOrClass);
    setFormDesc(subj.description);
    setFormChapter('');
    setShowAddModal(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        code: formCode.trim().toUpperCase() || editingSubject.code,
        name: formName.trim(),
        level: formLevel,
        course: formCourse.trim(),
        semesterOrClass: formSemester.trim(),
        description: formDesc.trim(),
      });
    } else {
      const newId = addSubject({
        code: formCode || 'SUB-101',
        name: formName,
        level: formLevel,
        course: formCourse,
        semesterOrClass: formSemester,
        description: formDesc,
        initialChapterTitle: formChapter,
      });
      setSelectedSubjectId(newId);
    }
    setShowAddModal(false);
  };

  const triggerAiAction = (promptText: string) => {
    if (onOpenAi) {
      onOpenAi(promptText);
    }
  };

  const launchFullKampusAi = (toolId: 'explain' | 'quiz' | 'notes', payload: Record<string, any>) => {
    localStorage.setItem('kampus_ai_handoff_v1', JSON.stringify({ toolId, payload }));
    navigate('/learn/kampus-ai');
  };

  // VIEW 3: CHAPTER & TOPIC EXPLORER
  if (selectedSubject && selectedChapter) {
    const completedTopicsCount = selectedChapter.topics.filter((t) => t.completed).length;
    const chapterPct =
      selectedChapter.topics.length > 0
        ? Math.round((completedTopicsCount / selectedChapter.topics.length) * 100)
        : selectedChapter.completed
        ? 100
        : 0;

    const relatedMaterials = state.materials.filter(
      (m) =>
        selectedChapter.relatedMaterialIds.includes(m.id) || m.subjectId === selectedSubject.id
    );
    const chapterQuestions = state.questions.filter(
      (q) => q.chapterId === selectedChapter.id || q.subjectId === selectedSubject.id
    );
    const relatedPyqs = state.papers.filter((p) => p.subjectId === selectedSubject.id);

    return (
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                onClick={() => {
                  setSelectedChapterId(null);
                  setSelectedTopicId(null);
                }}
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{selectedSubject.code}</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Chapter {selectedChapter.number}: {selectedChapter.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleChapterBookmark(selectedSubject.id, selectedChapter.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  selectedChapter.bookmarked
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${selectedChapter.bookmarked ? 'fill-current' : ''}`} />
                <span>{selectedChapter.bookmarked ? 'Bookmarked' : 'Bookmark Chapter'}</span>
              </button>

              <button
                onClick={() => toggleChapterComplete(selectedSubject.id, selectedChapter.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  selectedChapter.completed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{selectedChapter.completed ? 'Chapter Completed' : 'Mark Complete'}</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Chapter {selectedChapter.number}: {selectedChapter.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              {selectedChapter.overview}
            </p>
          </div>

          {/* Learning Objectives */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Learning Objectives
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-slate-700 dark:text-slate-200">
              {selectedChapter.learningObjectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chapter Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Chapter Progress ({completedTopicsCount}/{selectedChapter.topics.length} topics)
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {chapterPct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${chapterPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* KAMPUS AI Contextual Integration Toolbar */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>KAMPUS AI Study Actions for this Chapter</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Powered by KAMPUS AI · Open Quick Copilot or launch full workspace tools
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                launchFullKampusAi('explain', {
                  topic: selectedTopic?.title || selectedChapter.title,
                  subject: selectedSubject.name,
                  courseOrClass: `${selectedSubject.course} · ${selectedSubject.semesterOrClass}`,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open in Topic Explainer
            </button>
            <button
              onClick={() =>
                launchFullKampusAi('quiz', {
                  subject: selectedSubject.name,
                  chapter: selectedChapter.title,
                  topic: selectedTopic?.title || selectedChapter.title,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Quiz in KAMPUS AI
            </button>
            {[
              {
                label: 'Quick Explain',
                prompt: `Explain "${selectedTopic?.title || selectedChapter.title}" in ${selectedSubject.name} step-by-step.`,
              },
              {
                label: 'Summarize Chapter',
                prompt: `Summarize Chapter ${selectedChapter.number}: ${selectedChapter.title} (${selectedSubject.name}).`,
              },
              {
                label: 'Quick Revision Notes',
                prompt: `Create concise exam revision notes for "${selectedChapter.title}" in ${selectedSubject.name}.`,
              },
            ].map((act) => (
              <button
                key={act.label}
                onClick={() => triggerAiAction(act.prompt)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {act.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Grid + Topic Reader */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Topic List */}
          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 px-1">
              Topics ({selectedChapter.topics.length})
            </h3>
            {selectedChapter.topics.map((tp, idx) => {
              const isActive = selectedTopic?.id === tp.id;
              const isResumeTarget = selectedChapter.lastTopicId === tp.id;
              return (
                <div
                  key={tp.id}
                  onClick={() => {
                    setSelectedTopicId(tp.id);
                    setReadingPosition(selectedSubject.id, selectedChapter.id, tp.id);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTopicComplete(selectedSubject.id, selectedChapter.id, tp.id);
                      }}
                      className={`mt-0.5 shrink-0 cursor-pointer ${
                        tp.completed ? 'text-emerald-600' : 'text-slate-400 hover:text-blue-600'
                      }`}
                      title={tp.completed ? 'Completed' : 'Mark topic complete'}
                    >
                      {tp.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                          Topic {idx + 1} · {tp.estimatedMinutes}m
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTopicBookmark(selectedSubject.id, selectedChapter.id, tp.id);
                          }}
                          className={`cursor-pointer ${
                            tp.bookmarked ? 'text-orange-500' : 'text-slate-300 hover:text-orange-400'
                          }`}
                          title="Bookmark topic"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${tp.bookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {tp.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {tp.summary}
                      </p>
                      {isResumeTarget && (
                        <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-1.5">
                          Last Studied Position
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Active Topic Notes, Key Concepts & Personal Chapter Notes */}
          <div className="lg:col-span-7 space-y-5">
            {selectedTopic && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Study Notes & Important Concepts
                  </span>
                  <button
                    onClick={() =>
                      setReadingPosition(selectedSubject.id, selectedChapter.id, selectedTopic.id)
                    }
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                  >
                    Set as Resume Position
                  </button>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedTopic.title}
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedTopic.studyNotes}
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Important Concepts
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.keyConcepts.map((kc, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-medium"
                      >
                        {kc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Personal Chapter Notes Box */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Personal Chapter Notes (Autosaved locally)
                </label>
                {noteSavedToast && (
                  <span className="text-xs font-semibold text-emerald-600">Saved</span>
                )}
              </div>
              <textarea
                rows={4}
                value={selectedChapter.personalChapterNotes}
                onChange={(e) => {
                  updateChapterNotes(selectedSubject.id, selectedChapter.id, e.target.value);
                  setNoteSavedToast(true);
                  setTimeout(() => setNoteSavedToast(false), 1200);
                }}
                placeholder="Write formulas, theorem proofs, or quick revision reminders for this chapter..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            {/* Related PDFs, Practice Questions & PYQs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Related PDFs ({relatedMaterials.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Open Library
                  </button>
                </div>
                {relatedMaterials.slice(0, 2).map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {m.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {m.fileType} · {m.fileSize}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-orange-500" />
                    Practice & PYQs ({chapterQuestions.length + relatedPyqs.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('qbank')}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Question Bank
                  </button>
                </div>
                {chapterQuestions.length > 0 ? (
                  <button
                    onClick={() =>
                      launchPracticeTest({
                        title: `${selectedSubject.code}: Ch ${selectedChapter.number} Practice Quiz`,
                        mode: 'Chapter Test',
                        subjectId: selectedSubject.id,
                        questionIds: chapterQuestions.map((q) => q.id),
                        durationMinutes: Math.max(5, chapterQuestions.length * 2),
                        timed: true,
                      })
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Start Chapter Practice Test ({chapterQuestions.length} Qs)</span>
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">Add questions in Question Bank or take a custom test.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: SUBJECT DETAIL (CHAPTER LIST)
  if (selectedSubject) {
    const totalTopics = selectedSubject.chapters.reduce((a, c) => a + c.topics.length, 0);
    const doneTopics = selectedSubject.chapters.reduce(
      (a, c) => a + c.topics.filter((t) => t.completed).length,
      0
    );
    const subjectPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-4 bg-slate-100 dark:bg-slate-800">
              <img
                src={selectedSubject.imageUrl}
                alt={selectedSubject.name}
                referrerPolicy="no-referrer"
                className="w-full h-48 md:h-full object-cover"
              />
            </div>
            <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedSubjectId(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Subjects</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(selectedSubject)}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Customize Subject"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {selectedSubject.isCustom && (
                      <button
                        onClick={() => deleteSubject(selectedSubject.id)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="Delete Custom Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedSubject.code}
                  </span>
                  <span>·</span>
                  <span>{selectedSubject.level}</span>
                  <span>·</span>
                  <span>{selectedSubject.course}</span>
                  <span>·</span>
                  <span>{selectedSubject.semesterOrClass}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedSubject.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5">
                  {selectedSubject.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    Overall Subject Progress ({doneTopics}/{totalTopics} topics completed)
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {subjectPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${subjectPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Chapters ({selectedSubject.chapters.length})
          </h3>
          {selectedSubject.chapters.map((ch) => {
            const doneT = ch.topics.filter((t) => t.completed).length;
            const pct = ch.topics.length > 0 ? Math.round((doneT / ch.topics.length) * 100) : 0;
            return (
              <div
                key={ch.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      Chapter {ch.number}
                    </span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {doneT}/{ch.topics.length} Topics ({pct}%)
                    </span>
                    {ch.completed && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-600 font-semibold">Completed</span>
                      </>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {ch.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{ch.overview}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleChapterBookmark(selectedSubject.id, ch.id)}
                    className={`p-2 rounded-xl border cursor-pointer ${
                      ch.bookmarked
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 text-orange-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                    title="Bookmark chapter"
                  >
                    <Bookmark className={`w-4 h-4 ${ch.bookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => toggleChapterComplete(selectedSubject.id, ch.id)}
                    className={`p-2 rounded-xl border cursor-pointer ${
                      ch.completed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                    title="Toggle chapter completion"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChapterId(ch.id);
                      setSelectedTopicId(ch.lastTopicId || ch.topics[0]?.id || null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Explore Topics</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // VIEW 1: SUBJECT MANAGEMENT DIRECTORY
  return (
    <div className="space-y-6">
      {/* Controls & Add Subject */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Subject Management & Academic Levels
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize subjects across School, Class 11–12, Undergraduate, Postgraduate, and Competitive Exams.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Subject</span>
          </button>
        </div>

        {/* Educational Level Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  levelFilter === lvl
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            {uniqueCourses.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Courses / Streams' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No subjects match this level or course filter
          </p>
          <button
            onClick={openCreateModal}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subj) => {
            const totalCh = subj.chapters.length;
            const doneCh = subj.chapters.filter((c) => c.completed).length;
            const totalTp = subj.chapters.reduce((a, c) => a + c.topics.length, 0);
            const doneTp = subj.chapters.reduce(
              (a, c) => a + c.topics.filter((t) => t.completed).length,
              0
            );
            const pct = totalTp > 0 ? Math.round((doneTp / totalTp) * 100) : 0;

            return (
              <div
                key={subj.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-36 bg-slate-100 dark:bg-slate-800 relative">
                    <img
                      src={subj.imageUrl}
                      alt={subj.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 sm:p-5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {subj.code} · {subj.level}
                      </span>
                      <span>{subj.semesterOrClass}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {subj.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 tabular-nums">
                        {doneCh}/{totalCh} chapters
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSubjectId(subj.id)}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Open Subject
                    </button>
                    <button
                      onClick={() => openEditModal(subj)}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Customize subject"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Customize Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {editingSubject ? 'Customize Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    placeholder="CS-309"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Operating Systems"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Educational Level
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as EducationLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {LEVELS.filter((l) => l !== 'All').map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Semester / Class
                  </label>
                  <input
                    type="text"
                    placeholder="Semester 6 / Class 12"
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Course / Exam Program
                </label>
                <input
                  type="text"
                  placeholder="B.Tech CSE / JEE / CBSE"
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Syllabus highlights and learning scope..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              {!editingSubject && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    First Chapter Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Unit 1: Process Scheduling & Synchronization"
                    value={formChapter}
                    onChange={(e) => setFormChapter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingSubject ? 'Save Changes' : 'Create Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
