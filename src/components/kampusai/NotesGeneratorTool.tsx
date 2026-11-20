import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PenTool,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Download,
  BookOpen,
  Share2,
  Bookmark,
  RotateCcw,
  FileUp,
  Edit3,
  Eye,
  X,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import { useAuth } from '../../context/AuthContext';
import {
  AiAttachment,
  AiLanguage,
  AiLearningLevel,
  GeneratedNotesOutput,
} from '../../types/kampusAi';
import { runStructuredAiTool, uploadAndExtractDocument } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';
import { MarkdownRenderer } from './MarkdownRenderer';

export const NotesGeneratorTool: React.FC = () => {
  const navigate = useNavigate();
  const {
    preferences,
    addHistoryEntry,
    saveItem,
    pendingReopenData,
    clearPendingReopenData,
    getStudyHubSnapshot,
    saveNotesToStudyHub,
    prepareForNotesExchange,
  } = useKampusAi();
  const { profile } = useAuth();

  const studyHubSnap = getStudyHubSnapshot();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(studyHubSnap.subjects[0]?.name || 'Computer Science');
  const [targetSubjectId, setTargetSubjectId] = useState(studyHubSnap.subjects[0]?.id || '');
  const [courseSemester, setCourseSemester] = useState(`${profile.course} · ${profile.semester}`);
  const [notesLength, setNotesLength] = useState<'Short' | 'Medium' | 'Detailed'>('Medium');
  const [language, setLanguage] = useState<AiLanguage>(preferences.language);
  const [difficulty, setDifficulty] = useState<AiLearningLevel>(preferences.learningLevel);
  const [selectedMaterialText, setSelectedMaterialText] = useState('');
  const [attachment, setAttachment] = useState<AiAttachment | null>(null);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<GeneratedNotesOutput | null>(null);
  const [activeNoteView, setActiveNoteView] = useState<'complete' | 'short' | 'exam'>('complete');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedStudyHub, setSavedStudyHub] = useState(false);
  const [savedCollection, setSavedCollection] = useState(false);
  const [showExchangeConfirm, setShowExchangeConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingReopenData?.toolId === 'notes') {
      const p = pendingReopenData.payload || {};
      if (p.topic) setTopic(p.topic);
      if (p.subject) setSubject(p.subject);
      if (p.courseSemester) setCourseSemester(p.courseSemester);
      if (p.sourceText) setSelectedMaterialText(p.sourceText);
      if (p.notes) setNotes(p.notes);
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const att = await uploadAndExtractDocument(file);
      setAttachment(att);
      if (!topic.trim()) setTopic(file.name.replace(/\.[^/.]+$/, ''));
    } catch (err: any) {
      setError(err?.message || 'Unable to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const generateNotes = async () => {
    if (!topic.trim() && !selectedMaterialText && !attachment) return;
    setError(null);
    setLoading(true);
    setSavedStudyHub(false);
    setSavedCollection(false);

    try {
      const materialCombined = [selectedMaterialText, attachment?.extractedText]
        .filter(Boolean)
        .join('\n\n');

      const data = await runStructuredAiTool<GeneratedNotesOutput>('generate-notes', {
        topic: topic.trim() || attachment?.fileName || 'Study Material Notes',
        subject: subject.trim(),
        courseSemester: courseSemester.trim(),
        notesLength,
        language,
        difficulty,
        materialText: materialCombined || undefined,
        attachment:
          attachment && !attachment.extractedText && attachment.base64Data
            ? { mimeType: attachment.mimeType, base64Data: attachment.base64Data }
            : undefined,
      });

      setNotes(data);
      addHistoryEntry({
        category: 'Generated Notes',
        toolId: 'notes',
        title: data.title || topic.trim(),
        subtitle: `${subject} · ${notesLength} (${language})`,
        payload: { topic, subject, courseSemester, notes: data },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate study notes.');
    } finally {
      setLoading(false);
    }
  };

  const buildFullMarkdown = (n: GeneratedNotesOutput) =>
    [
      `# ${n.title}`,
      `Subject: ${subject} | Course: ${courseSemester}`,
      '',
      '## Complete Notes',
      n.completeNotes,
      '',
      '## Short Revision Notes',
      n.shortRevisionNotes,
      '',
      '## Exam-Oriented Notes',
      n.examOrientedNotes,
      '',
      '## Key Definitions',
      ...n.definitions.map((d) => `- ${d}`),
      '',
      '## Key Concepts',
      ...n.keyConcepts.map((c) => `- ${c}`),
      '',
      '## Formulas & Equations',
      ...n.formulas.map((f) => `- ${f}`),
      '',
      '## Diagram & Process Explanation',
      n.diagramExplanation,
      '',
      '## Important Questions',
      ...n.importantQuestions.map((q, i) => `${i + 1}. ${q}`),
      '',
      '## Quick Revision Points',
      ...n.quickRevisionPoints.map((p) => `- ${p}`),
    ].join('\n');

  const handleCopy = () => {
    if (!notes) return;
    navigator.clipboard.writeText(buildFullMarkdown(notes));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExportDownload = () => {
    if (!notes) return;
    const blob = new Blob([buildFullMarkdown(notes)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(notes.title || 'kampus-ai-notes').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSaveToStudyHub = () => {
    if (!notes) return;
    saveNotesToStudyHub(notes, targetSubjectId || undefined);
    setSavedStudyHub(true);
  };

  const handleConfirmShareToExchange = () => {
    if (!notes) return;
    prepareForNotesExchange(notes.title, `${subject} (${courseSemester})`, buildFullMarkdown(notes));
    setShowExchangeConfirm(false);
    navigate('/learn/notes-exchange');
  };

  return (
    <div className="space-y-6">
      <AiStatusBanner compact={!error} errorOverride={error} onRetry={generateNotes} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          generateNotes();
        }}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              AI Notes Generator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate complete, short-revision & exam-oriented notes from topics, Study Hub materials, or uploaded files.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic / Chapter Title
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Write-Ahead Logging & ARIES Recovery, Electromagnetic Induction..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Study Hub Subject
            </label>
            <select
              value={targetSubjectId}
              onChange={(e) => {
                setTargetSubjectId(e.target.value);
                const found = studyHubSnap.subjects.find((s) => s.id === e.target.value);
                if (found) setSubject(found.name);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              {studyHubSnap.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course & Semester / Class
            </label>
            <input
              type="text"
              value={courseSemester}
              onChange={(e) => setCourseSemester(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes Length & Depth
            </label>
            <select
              value={notesLength}
              onChange={(e) => setNotesLength(e.target.value as 'Short' | 'Medium' | 'Detailed')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              <option value="Short">Short (Quick Revision)</option>
              <option value="Medium">Medium (Balanced)</option>
              <option value="Detailed">Detailed (Comprehensive)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as AiLanguage)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as AiLearningLevel)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optional Source Material / File Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Optional: Use Study Hub Material
            </label>
            <select
              onChange={(e) => {
                const mat = studyHubSnap.materials.find((m) => m.id === e.target.value);
                if (mat) {
                  setSelectedMaterialText(`${mat.title}\n${mat.description}\n\n${mat.previewContent}`);
                  if (!topic.trim()) setTopic(mat.chapterName || mat.title);
                } else {
                  setSelectedMaterialText('');
                }
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              defaultValue=""
            >
              <option value="">-- Optional: Select Study Hub material --</option>
              {studyHubSnap.materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.subjectName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Optional: Upload Lecture PDF / DOCX / PPTX / TXT
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5 text-blue-600" />}
                <span>{attachment ? attachment.fileName : 'Attach Source File'}</span>
              </button>
              {attachment && (
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || (!topic.trim() && !selectedMaterialText && !attachment)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Generating Notes...' : 'Generate Study Notes'}</span>
          </button>
        </div>
      </form>

      {/* Output Editor & Export */}
      {notes && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {notes.title}
              </h3>
              <p className="text-xs text-slate-500">
                {subject} · {courseSemester}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing((p) => !p)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Preview' : 'Edit Notes'}</span>
              </button>
              <button
                type="button"
                onClick={generateNotes}
                disabled={loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .MD</span>
              </button>
              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  saveItem({
                    collection: 'Notes',
                    title: notes.title,
                    summary: `${subject} · ${notes.quickRevisionPoints.slice(0, 2).join(' · ')}`,
                    toolId: 'notes',
                    data: { topic, subject, courseSemester, notes },
                  });
                  setSavedCollection(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {savedCollection ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-orange-500" />}
                <span>{savedCollection ? 'Saved' : 'Save'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveToStudyHub}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{savedStudyHub ? 'Saved to Study Hub' : 'Save to Study Hub'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExchangeConfirm(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share to Notes Exchange</span>
              </button>
            </div>
          </div>

          {/* Note Format Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            {[
              { id: 'complete', label: 'Complete Notes' },
              { id: 'short', label: 'Short Revision Notes' },
              { id: 'exam', label: 'Exam-Oriented Notes' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveNoteView(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                  activeNoteView === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Body View or Edit */}
          {isEditing ? (
            <textarea
              rows={14}
              value={
                activeNoteView === 'complete'
                  ? notes.completeNotes
                  : activeNoteView === 'short'
                  ? notes.shortRevisionNotes
                  : notes.examOrientedNotes
              }
              onChange={(e) => {
                const val = e.target.value;
                setNotes((prev) =>
                  prev
                    ? {
                        ...prev,
                        completeNotes: activeNoteView === 'complete' ? val : prev.completeNotes,
                        shortRevisionNotes: activeNoteView === 'short' ? val : prev.shortRevisionNotes,
                        examOrientedNotes: activeNoteView === 'exam' ? val : prev.examOrientedNotes,
                      }
                    : prev
                );
              }}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm leading-relaxed"
            />
          ) : (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <MarkdownRenderer
                content={
                  activeNoteView === 'complete'
                    ? notes.completeNotes
                    : activeNoteView === 'short'
                    ? notes.shortRevisionNotes
                    : notes.examOrientedNotes
                }
              />
            </div>
          )}

          {/* Structured Supporting Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                Definitions
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 list-disc ml-4">
                {notes.definitions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-500">
                Key Concepts & Formulas
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 list-disc ml-4">
                {notes.keyConcepts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              {notes.formulas.length > 0 && (
                <div className="pt-2 space-y-1">
                  {notes.formulas.map((f, i) => (
                    <div key={i} className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 font-mono text-xs border border-slate-200 dark:border-slate-700">
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Diagram / Process Explanation
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {notes.diagramExplanation}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                Important Exam Questions & Revision Bullets
              </h4>
              <ol className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200 list-decimal ml-4">
                {notes.importantQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700">
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc ml-4">
                  {notes.quickRevisionPoints.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Notes Exchange */}
      {showExchangeConfirm && notes && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Prepare Notes for Notes Exchange?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              This will pre-fill "{notes.title}" into the Notes Exchange publish form so you can review and confirm before sharing publicly with students.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExchangeConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmShareToExchange}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                Continue to Notes Exchange
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
