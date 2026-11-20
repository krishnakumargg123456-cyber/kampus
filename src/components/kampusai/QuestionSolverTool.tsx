import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator,
  Image as ImageIcon,
  FileText,
  Loader2,
  Sparkles,
  AlertCircle,
  Bookmark,
  Check,
  ClipboardCheck,
  PenTool,
  X,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import { AiAttachment, SolvedQuestionOutput } from '../../types/kampusAi';
import { runStructuredAiTool, uploadAndExtractDocument } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';

const SUBJECTS = [
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'Computer Science',
  'English',
  'Other',
];

export const QuestionSolverTool: React.FC = () => {
  const {
    preferences,
    addHistoryEntry,
    saveItem,
    pendingReopenData,
    clearPendingReopenData,
    launchToolWithPrefill,
  } = useKampusAi();

  const [subject, setSubject] = useState('Physics');
  const [questionText, setQuestionText] = useState('');
  const [attachment, setAttachment] = useState<AiAttachment | null>(null);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolvedQuestionOutput | null>(null);
  const [clarificationReply, setClarificationReply] = useState('');
  const [saved, setSaved] = useState(false);

  const imgRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingReopenData?.toolId === 'solver') {
      const p = pendingReopenData.payload || {};
      if (p.subject) setSubject(p.subject);
      if (p.questionText) setQuestionText(p.questionText);
      if (p.result) setResult(p.result);
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const att = await uploadAndExtractDocument(file);
      setAttachment(att);
    } catch (err: any) {
      setError(err?.message || 'Unable to process uploaded question file.');
    } finally {
      setUploading(false);
    }
  };

  const solve = async (modifier?: string, extraClarification?: string) => {
    const combinedText = extraClarification
      ? `${questionText.trim()}\nClarification: ${extraClarification.trim()}`
      : questionText.trim();
    if (!combinedText && !attachment) return;

    if (extraClarification) {
      setQuestionText(combinedText);
      setClarificationReply('');
    }

    setError(null);
    setLoading(true);
    setSaved(false);
    try {
      const data = await runStructuredAiTool<SolvedQuestionOutput>('solve-question', {
        subject,
        questionText: combinedText,
        language: preferences.language,
        learningLevel: preferences.learningLevel,
        modifier,
        extractedText: attachment?.extractedText,
        attachment:
          attachment && !attachment.extractedText && attachment.base64Data
            ? { mimeType: attachment.mimeType, base64Data: attachment.base64Data }
            : undefined,
      });
      setResult(data);
      if (!data.needsClarification) {
        addHistoryEntry({
          category: 'Solved Questions',
          toolId: 'solver',
          title: combinedText.slice(0, 52) || attachment?.fileName || 'Solved Problem',
          subtitle: `${subject} · ${data.finalAnswer.slice(0, 50)}`,
          payload: { subject, questionText: combinedText, result: data },
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to solve question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AiStatusBanner compact={!error} errorOverride={error} onRetry={() => solve()} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          solve();
        }}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                AI Question & Doubt Solver
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Type, paste, or upload an image/PDF of any problem for step-by-step reasoning and verification.
              </p>
            </div>
          </div>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                Subject: {s}
              </option>
            ))}
          </select>
        </div>

        <textarea
          rows={4}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Type or paste your numerical, derivation, equation, code error, or textbook problem..."
          className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-blue-600"
        />

        {attachment && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>{attachment.fileName}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="hover:text-rose-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={imgRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleFile}
              className="hidden"
            />
            <input
              ref={pdfRef}
              type="file"
              accept=".pdf"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imgRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-xs font-semibold cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload Question Image</span>
            </button>
            <button
              type="button"
              onClick={() => pdfRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-xs font-semibold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              <span>Upload Question PDF</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || uploading || (!questionText.trim() && !attachment)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            {loading || uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{loading ? 'Solving Step-by-Step...' : 'Solve Question'}</span>
          </button>
        </div>
      </form>

      {/* Ambiguity / Clarification Request */}
      {result?.needsClarification && (
        <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-orange-950 dark:text-orange-200">
                Clarification Needed Before Solving
              </h3>
              <p className="text-xs sm:text-sm text-orange-900 dark:text-orange-300 mt-1">
                {result.clarificationPrompt}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={clarificationReply}
              onChange={(e) => setClarificationReply(e.target.value)}
              placeholder="Provide the missing detail or value..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-700 text-xs sm:text-sm"
            />
            <button
              type="button"
              disabled={!clarificationReply.trim() || loading}
              onClick={() => solve(undefined, clarificationReply)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
            >
              Submit Clarification
            </button>
          </div>
        </div>
      )}

      {/* Full Step-by-Step Solution */}
      {result && !result.needsClarification && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Verified Step-by-Step Solution
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => solve('Explain every step in much simpler beginner-friendly language.')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-xs font-semibold cursor-pointer"
              >
                Explain in Simpler Language
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => solve('Solve the same problem using an alternative method or shortcut.')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-xs font-semibold cursor-pointer"
              >
                Alternative Method
              </button>
              <button
                type="button"
                onClick={() =>
                  launchToolWithPrefill('quiz', {
                    subject,
                    topic: questionText.slice(0, 80),
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Similar Questions</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  launchToolWithPrefill('notes', {
                    subject,
                    topic: questionText.slice(0, 80),
                    sourceText: result.solutionSteps.join('\n'),
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Revision Notes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  saveItem({
                    collection: 'Solutions',
                    title: questionText.slice(0, 60) || `${subject} Solution`,
                    summary: result.finalAnswer.slice(0, 90),
                    toolId: 'solver',
                    data: { subject, questionText, result },
                  });
                  setSaved(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-orange-500" />}
                <span>{saved ? 'Saved' : 'Save Solution'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                Question Understanding
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {result.questionUnderstanding}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Relevant Concepts
                </div>
                <ul className="list-disc ml-4 space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  {result.relevantConcepts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Formulas Used
                </div>
                {result.formulas.length === 0 ? (
                  <p className="text-xs text-slate-400">Conceptual reasoning applied (no fixed numeric formula).</p>
                ) : (
                  <div className="space-y-1.5">
                    {result.formulas.map((f, i) => (
                      <div key={i} className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs">
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Step-by-Step Solution
              </div>
              <ol className="space-y-2">
                {result.solutionSteps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                  >
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Final Answer
              </div>
              <div className="text-sm sm:text-base font-extrabold text-emerald-950 dark:text-emerald-100">
                {result.finalAnswer}
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 pt-1">
                <span className="font-semibold">Verification: </span>
                {result.whyCorrect}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
