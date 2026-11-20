import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Loader2,
  Sparkles,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Bookmark,
  Check,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import {
  AiLanguage,
  AiLearningLevel,
  GeneratedQuizOutput,
  GeneratedQuizQuestion,
} from '../../types/kampusAi';
import { runStructuredAiTool } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';

type QuizPhase = 'config' | 'running' | 'results';

export const QuizGeneratorTool: React.FC = () => {
  const {
    preferences,
    addHistoryEntry,
    saveItem,
    pendingReopenData,
    clearPendingReopenData,
  } = useKampusAi();

  const [subject, setSubject] = useState('Database Management Systems');
  const [chapter, setChapter] = useState('Normalization & Indexing');
  const [topic, setTopic] = useState('BCNF, 3NF, B+ Trees');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<AiLearningLevel>(preferences.learningLevel);
  const [questionType, setQuestionType] = useState<
    'MCQ' | 'MSQ' | 'True/False' | 'Fill in the Blanks' | 'Short Answer' | 'Mixed'
  >('MCQ');
  const [language, setLanguage] = useState<AiLanguage>(preferences.language);
  const [useTimer, setUseTimer] = useState(true);

  const [phase, setPhase] = useState<QuizPhase>('config');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<GeneratedQuizOutput | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [savedResult, setSavedResult] = useState(false);

  useEffect(() => {
    if (pendingReopenData?.toolId === 'quiz') {
      const p = pendingReopenData.payload || {};
      if (p.subject) setSubject(p.subject);
      if (p.chapter) setChapter(p.chapter);
      if (p.topic) setTopic(p.topic);
      if (p.quiz) {
        setQuiz(p.quiz);
        setAnswers({});
        setMarked({});
        setCurrentIdx(0);
        setElapsedSeconds(0);
        setPhase('running');
      }
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const startNewQuiz = async () => {
    if (!topic.trim() && !subject.trim()) return;
    setError(null);
    setLoading(true);
    setSavedResult(false);
    try {
      const data = await runStructuredAiTool<GeneratedQuizOutput>('generate-quiz', {
        subject: subject.trim(),
        chapter: chapter.trim(),
        topic: topic.trim(),
        count,
        difficulty,
        questionType,
        language,
      });
      setQuiz(data);
      setAnswers({});
      setMarked({});
      setCurrentIdx(0);
      setElapsedSeconds(0);
      setPhase('running');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const evaluateQuestion = (q: GeneratedQuizQuestion): boolean => {
    const ans = answers[q.id];
    if (q.type === 'MSQ') {
      const picked = Array.isArray(ans) ? [...ans].sort() : [];
      const expected = [...(q.correctAnswers || [])].sort();
      return picked.length > 0 && JSON.stringify(picked) === JSON.stringify(expected);
    }
    if (q.type === 'Short Answer') {
      return typeof ans === 'string' && ans.trim().length >= 8;
    }
    const strAns = typeof ans === 'string' ? ans.trim().toLowerCase() : '';
    const exp = (q.correctAnswer || '').trim().toLowerCase();
    return Boolean(strAns && exp && strAns === exp);
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    setShowSubmitModal(false);
    setPhase('results');

    const total = quiz.questions.length;
    const correctCount = quiz.questions.filter((q) => evaluateQuestion(q)).length;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;

    addHistoryEntry({
      category: 'Quizzes',
      toolId: 'quiz',
      title: quiz.title || `${subject}: ${topic}`,
      subtitle: `${correctCount}/${total} correct (${accuracy}%)`,
      payload: { subject, chapter, topic, quiz },
    });
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (phase === 'running' && quiz) {
    const q = quiz.questions[currentIdx];
    const currentAns = answers[q.id];

    const toggleMsqOption = (opt: string) => {
      const prev = Array.isArray(currentAns) ? currentAns : [];
      const next = prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt];
      setAnswers({ ...answers, [q.id]: next });
    };

    return (
      <div className="space-y-4">
        {/* Top Bar */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
              {quiz.title}
            </h3>
            <p className="text-xs text-slate-500 tabular-nums">
              Question {currentIdx + 1} of {quiz.questions.length} · {q.type} · {q.difficulty}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {useTimer && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {formatTime(elapsedSeconds)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
            >
              Submit Quiz
            </button>
          </div>
        </div>

        {/* Navigation Strip */}
        <div className="flex flex-wrap gap-1.5">
          {quiz.questions.map((item, idx) => {
            const answered =
              Array.isArray(answers[item.id])
                ? (answers[item.id] as string[]).length > 0
                : Boolean(answers[item.id]);
            const isCurr = idx === currentIdx;
            const isMarked = marked[item.id];
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-9 h-9 rounded-xl text-xs font-bold tabular-nums border cursor-pointer ${
                  isCurr
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isMarked
                    ? 'bg-orange-50 text-orange-600 border-orange-400'
                    : answered
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold text-blue-600">Topic: {q.topicTag}</span>
            <button
              type="button"
              onClick={() => setMarked({ ...marked, [q.id]: !marked[q.id] })}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                marked[q.id]
                  ? 'bg-orange-50 border-orange-400 text-orange-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{marked[q.id] ? 'Marked' : 'Mark for Review'}</span>
            </button>
          </div>

          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
            {q.question}
          </h4>

          {/* Interactive Inputs by Type */}
          {(q.type === 'MCQ' || q.type === 'True/False') && q.options && (
            <div className="space-y-2.5">
              {q.options.map((opt) => {
                const selected = currentAns === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 font-semibold text-blue-900 dark:text-blue-200'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'MSQ' && q.options && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500">Select all correct options:</p>
              {q.options.map((opt) => {
                const selected = Array.isArray(currentAns) && currentAns.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMsqOption(opt)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 font-semibold'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'Fill in the Blanks' && (
            <input
              type="text"
              value={typeof currentAns === 'string' ? currentAns : ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              placeholder="Type the missing term..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          )}

          {q.type === 'Short Answer' && (
            <textarea
              rows={4}
              value={typeof currentAns === 'string' ? currentAns : ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              placeholder="Write your concise answer..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIdx < quiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
              >
                Finish & Submit
              </button>
            )}
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl">
              <h3 className="text-base font-extrabold">Submit Practice Quiz?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You have answered {Object.keys(answers).length} of {quiz.questions.length} questions.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Review Questions
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'results' && quiz) {
    const evaluated = quiz.questions.map((q) => ({ q, isCorrect: evaluateQuestion(q) }));
    const correctCount = evaluated.filter((e) => e.isCorrect).length;
    const total = quiz.questions.length;
    const incorrectCount = total - correctCount;
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    const weakTopics = Array.from(
      new Set(evaluated.filter((e) => !e.isCorrect).map((e) => e.q.topicTag))
    );

    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Quiz Results · {quiz.title}
              </h3>
              <p className="text-xs text-slate-500">
                Completed in {formatTime(elapsedSeconds)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  saveItem({
                    collection: 'Quiz Results',
                    title: quiz.title,
                    summary: `Score ${correctCount}/${total} (${accuracy}%) · ${subject}`,
                    toolId: 'quiz',
                    data: { subject, chapter, topic, quiz },
                  });
                  setSavedResult(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {savedResult ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-orange-500" />}
                <span>{savedResult ? 'Saved' : 'Save Result'}</span>
              </button>
              <button
                onClick={() => {
                  setAnswers({});
                  setMarked({});
                  setCurrentIdx(0);
                  setElapsedSeconds(0);
                  setPhase('running');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Quiz</span>
              </button>
              <button
                onClick={() => setPhase('config')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                New Quiz
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30">
              <div className="text-xs text-slate-500">Total Score</div>
              <div className="text-2xl font-extrabold text-blue-600 tabular-nums">
                {correctCount}/{total}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30">
              <div className="text-xs text-slate-500">Accuracy</div>
              <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
                {accuracy}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30">
              <div className="text-xs text-slate-500">Incorrect</div>
              <div className="text-2xl font-extrabold text-rose-600 tabular-nums">
                {incorrectCount}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-xs text-slate-500">Time Taken</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatTime(elapsedSeconds)}
              </div>
            </div>
          </div>

          {weakTopics.length > 0 && (
            <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-800/50 text-xs">
              <span className="font-bold text-orange-800 dark:text-orange-300">
                Weak Topics & Suggested Revision:{' '}
              </span>
              <span className="text-orange-900 dark:text-orange-200">
                Review {weakTopics.join(', ')} using Topic Explainer or Flashcards.
              </span>
            </div>
          )}

          <div className="space-y-3">
            {evaluated.map(({ q, isCorrect }, i) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {i + 1}. {q.question}
                  </div>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 shrink-0">
                      <XCircle className="w-4 h-4" />
                      Review
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Your Answer: </span>
                  {Array.isArray(answers[q.id])
                    ? (answers[q.id] as string[]).join(', ')
                    : String(answers[q.id] || 'Not attempted')}
                  {' · '}
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Expected:{' '}
                  </span>
                  {q.correctAnswers?.join(', ') || q.correctAnswer || q.modelAnswer}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                  <span className="font-semibold">Explanation:</span> {q.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AiStatusBanner compact={!error} errorOverride={error} onRetry={startNewQuiz} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startNewQuiz();
        }}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              AI Quiz Generator & Practice Runner
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate custom MCQ, MSQ, True/False, Fill-in-Blank, or Short Answer quizzes with instant analysis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chapter
            </label>
            <input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic Focus
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              <option value="MCQ">MCQ (Single Choice)</option>
              <option value="MSQ">MSQ (Multiple Correct)</option>
              <option value="True/False">True / False</option>
              <option value="Fill in the Blanks">Fill in the Blanks</option>
              <option value="Short Answer">Short Answer</option>
              <option value="Mixed">Mixed Types</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Number of Questions ({count})
            </label>
            <input
              type="range"
              min={3}
              max={15}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-blue-600 mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useTimer}
              onChange={(e) => setUseTimer(e.target.checked)}
              className="accent-blue-600"
            />
            <span>Track elapsed time during quiz</span>
          </label>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Generating Quiz...' : 'Generate & Start Quiz'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
