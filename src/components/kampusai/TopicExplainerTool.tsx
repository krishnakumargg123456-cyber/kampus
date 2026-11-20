import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Loader2,
  Sparkles,
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  PenTool,
  Bookmark,
  Check,
  AlertTriangle,
  FlaskConical,
  ListChecks,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import { useAuth } from '../../context/AuthContext';
import { AiLanguage, AiLearningLevel, TopicExplanationOutput } from '../../types/kampusAi';
import { runStructuredAiTool } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';
import { MarkdownRenderer } from './MarkdownRenderer';

export const TopicExplainerTool: React.FC = () => {
  const {
    preferences,
    addHistoryEntry,
    saveItem,
    pendingReopenData,
    clearPendingReopenData,
    launchToolWithPrefill,
    createNewConversation,
    setToolDraftPrompt,
    setActiveTool,
  } = useKampusAi();
  const { profile } = useAuth();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Computer Science & Algorithms');
  const [courseOrClass, setCourseOrClass] = useState(`${profile.course} · ${profile.semester}`);
  const [learningLevel, setLearningLevel] = useState<AiLearningLevel>(preferences.learningLevel);
  const [language, setLanguage] = useState<AiLanguage>(preferences.language);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TopicExplanationOutput | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (pendingReopenData?.toolId === 'explain') {
      const p = pendingReopenData.payload || {};
      if (p.topic) setTopic(p.topic);
      if (p.subject) setSubject(p.subject);
      if (p.courseOrClass) setCourseOrClass(p.courseOrClass);
      if (p.result) setResult(p.result);
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  const generateExplanation = async (modifier?: string) => {
    if (!topic.trim()) return;
    setError(null);
    setLoading(true);
    setSaved(false);
    try {
      const data = await runStructuredAiTool<TopicExplanationOutput>('explain-topic', {
        topic: topic.trim(),
        subject: subject.trim(),
        courseOrClass: courseOrClass.trim(),
        learningLevel,
        language,
        modifier,
      });
      setResult(data);
      addHistoryEntry({
        category: 'Explanations',
        toolId: 'explain',
        title: topic.trim(),
        subtitle: `${subject.trim()} · ${learningLevel} (${language})`,
        payload: { topic: topic.trim(), subject: subject.trim(), courseOrClass, result: data },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to explain topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    saveItem({
      collection: 'Explanations',
      title: topic.trim() || 'Topic Explanation',
      summary: `${subject} · ${result.simpleDefinition.slice(0, 90)}...`,
      toolId: 'explain',
      data: { topic, subject, courseOrClass, result },
    });
    setSaved(true);
  };

  const handleFollowUpChat = () => {
    createNewConversation(`Topic: ${topic.trim()}`);
    setToolDraftPrompt(
      `I just reviewed the explanation of "${topic.trim()}" (${subject}). Please help me with follow-up doubts and exam edge cases.`
    );
    setActiveTool('chat');
  };

  return (
    <div className="space-y-6">
      <AiStatusBanner compact={!error} errorOverride={error} onRetry={() => generateExplanation()} />

      {/* Input Configuration Card */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generateExplanation();
        }}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Explain a Topic
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured concept clarity with formulas, real-life examples, common mistakes, and revision points.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic Name
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Dijkstra Shortest Path, Faraday's Law, BCNF Normalization..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Algorithms, Physics, Organic Chemistry"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Class / Course
            </label>
            <input
              type="text"
              value={courseOrClass}
              onChange={(e) => setCourseOrClass(e.target.value)}
              placeholder="e.g. Class 12 CBSE / B.Tech Sem 6"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Learning Level
            </label>
            <select
              value={learningLevel}
              onChange={(e) => setLearningLevel(e.target.value as AiLearningLevel)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preferred Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as AiLanguage)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Hinglish">Hinglish</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {['Dynamic Programming on Trees', 'Bayes Theorem & Conditional Probability', 'SN1 vs SN2 Reaction Mechanism'].map(
              (sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setTopic(sample)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  {sample}
                </button>
              )
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Explaining...' : 'Explain Topic'}</span>
          </button>
        </div>
      </form>

      {/* Structured Explanation Output */}
      {result && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {topic} <span className="text-slate-400 font-normal">· {subject}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  generateExplanation('Rewrite in much simpler beginner language with an easy analogy.')
                }
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Explain More Simply
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  generateExplanation('Provide fresh everyday and Indian campus-related real-life examples.')
                }
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Give Another Example
              </button>
              <button
                type="button"
                onClick={handleFollowUpChat}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Follow-Up</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  launchToolWithPrefill('quiz', { subject, topic })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 text-xs font-semibold cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Generate Quiz</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  launchToolWithPrefill('notes', { subject, topic })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Create Notes</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer"
              >
                {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-orange-500" />}
                <span>{saved ? 'Saved' : 'Save Explanation'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              {/* Intro & Simple Definition */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                    Topic Introduction
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {result.introduction}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60">
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">
                    Simple Definition
                  </h4>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    {result.simpleDefinition}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-2">
                    Detailed Explanation
                  </h3>
                  <MarkdownRenderer content={result.detailedExplanation} />
                </div>
              </div>

              {/* Step-by-Step Breakdown */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 shadow-2xs">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-blue-600" />
                  <span>Step-by-Step Breakdown</span>
                </h3>
                <ol className="space-y-2.5">
                  {result.stepByStepBreakdown.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                    >
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                        {i + 1}
                      </span>
                      <div className="leading-relaxed">{step}</div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Real-life Examples */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 shadow-2xs">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-orange-500" />
                  <span>Real-Life Examples</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.realLifeExamples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Column: Concepts, Formulas, Mistakes, Summary */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-2.5 shadow-2xs">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Important Concepts</span>
                </h3>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc ml-4">
                  {result.importantConcepts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {result.importantFormulas.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-2.5 shadow-2xs">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Important Formulas & Rules
                  </h3>
                  <div className="space-y-2">
                    {result.importantFormulas.map((f, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-2.5 shadow-2xs">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Key Points to Remember
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc ml-4">
                  {result.keyPoints.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/50 p-5 space-y-2 shadow-2xs">
                <h3 className="text-sm font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Common Mistakes to Avoid</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-rose-800 dark:text-rose-200 list-disc ml-4">
                  {result.commonMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-slate-900 text-white p-5 space-y-2 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Quick Revision Summary
                </h3>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                  {result.quickRevisionSummary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
