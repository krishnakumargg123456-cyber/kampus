import React, { useState, useEffect } from 'react';
import {
  NotebookText,
  Loader2,
  Sparkles,
  CheckSquare,
  Square,
  FileText,
  Bookmark,
  Check,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import { AskNotesOutput } from '../../types/kampusAi';
import { runStructuredAiTool } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';
import { MarkdownRenderer } from './MarkdownRenderer';

const ACTIONS = [
  'Answer Question',
  'Explain Paragraph',
  'Find Relevant Info',
  'Summarize Material',
  'Generate Questions',
];

export const AskFromNotesTool: React.FC = () => {
  const {
    preferences,
    getStudyHubSnapshot,
    addHistoryEntry,
    saveItem,
    pendingReopenData,
    clearPendingReopenData,
  } = useKampusAi();

  const studyHubSnap = getStudyHubSnapshot();

  const allSources = [
    ...studyHubSnap.notes.map((n) => ({
      id: n.id,
      title: n.title,
      label: 'Personal Note',
      content: `${n.title}\n${n.description}\n${n.content}`,
    })),
    ...studyHubSnap.materials.map((m) => ({
      id: m.id,
      title: m.title,
      label: `${m.subjectName} · ${m.category}`,
      content: `${m.title}\n${m.description}\n${m.previewContent}`,
    })),
  ];

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    allSources[0] ? [allSources[0].id] : []
  );
  const [action, setAction] = useState(ACTIONS[0]);
  const [question, setQuestion] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskNotesOutput | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (pendingReopenData?.toolId === 'ask-notes') {
      const p = pendingReopenData.payload || {};
      if (p.question) setQuestion(p.question);
      if (p.result) setResult(p.result);
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  const toggleSource = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleQueryNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const chosen = allSources.filter((s) => selectedIds.includes(s.id));
    const notesContext = chosen
      .map((s) => `=== SOURCE: ${s.title} (${s.label}) ===\n${s.content}`)
      .join('\n\n');

    setError(null);
    setLoading(true);
    setSaved(false);
    try {
      const data = await runStructuredAiTool<AskNotesOutput>('ask-my-notes', {
        action,
        question: question.trim() || action,
        notesContext,
        language: preferences.language,
      });
      setResult(data);
      addHistoryEntry({
        category: 'Explanations',
        toolId: 'ask-notes',
        title: `My Notes: ${question.trim() || action}`,
        subtitle: `${chosen.length} Study Hub source(s) referenced`,
        payload: { question, result: data },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to query selected notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AiStatusBanner compact={!error} errorOverride={error} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Select Study Hub Notes & Materials */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Select Study Hub Notes & Materials
            </h3>
            <span className="text-xs font-semibold text-blue-600 tabular-nums">
              {selectedIds.length} selected
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {allSources.map((src) => {
              const checked = selectedIds.includes(src.id);
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => toggleSource(src.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                    checked
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {src.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{src.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Query Composer & Cited Results */}
        <div className="lg:col-span-7 space-y-4">
          <form
            onSubmit={handleQueryNotes}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0">
                <NotebookText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Ask from My Notes
                </h2>
                <p className="text-xs text-slate-500">
                  Answers strictly separate facts found in your Study Hub materials from extra AI context.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ACTIONS.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setAction(act)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    action === act
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question, paste a paragraph from your notes to explain, or leave brief for summary..."
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || selectedIds.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'Analyzing Selected Notes...' : 'Run on Selected Notes'}</span>
              </button>
            </div>
          </form>

          {result && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Source-Grounded Answer
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    saveItem({
                      collection: 'Explanations',
                      title: `My Notes: ${question.trim() || action}`,
                      summary: result.foundInNotes.slice(0, 90),
                      toolId: 'ask-notes',
                      data: { question, result },
                    });
                    setSaved(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-orange-500" />}
                  <span>{saved ? 'Saved' : 'Save Answer'}</span>
                </button>
              </div>

              {/* Source Citations */}
              <div className="flex flex-wrap gap-1.5">
                {result.sourceReferences.map((ref, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold"
                  >
                    <FileText className="w-3 h-3" />
                    {ref}
                  </span>
                ))}
              </div>

              {/* Found Directly in Notes */}
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 space-y-1.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Information Found in Selected Material
                </div>
                <MarkdownRenderer content={result.foundInNotes} />
              </div>

              {/* Additional AI Explanation */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  Additional AI-Generated Explanation
                </div>
                <MarkdownRenderer content={result.additionalAiExplanation} />
              </div>

              {result.generatedQuestions.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-orange-500">
                    Practice Questions from Selected Notes
                  </div>
                  <ol className="list-decimal ml-4 space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {result.generatedQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
