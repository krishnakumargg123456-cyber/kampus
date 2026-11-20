import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  History,
  AlertTriangle,
} from 'lucide-react';
import { useStudyHub } from '../../context/StudyHubContext';
import { PracticeTestAnswerRecord, PracticeTestResult, QuestionBankItem } from '../../types/studyHub';

export const PracticeTestView: React.FC = () => {
  const {
    state,
    pendingTestLaunch,
    setPendingTestLaunch,
    saveTestResult,
  } = useStudyHub();

  // Setup state
  const [setupMode, setSetupMode] = useState<'Chapter Test' | 'Subject Test' | 'Custom Test'>('Subject Test');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(state.subjects[0]?.id || 'subj-cs302');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [isTimed, setIsTimed] = useState(true);
  const [durationMins, setDurationMins] = useState(15);
  const [maxQs, setMaxQs] = useState(6);

  // Active Test Session state
  const [activeTest, setActiveTest] = useState<{
    title: string;
    mode: PracticeTestResult['mode'];
    subjectId: string;
    questions: QuestionBankItem[];
    timed: boolean;
    durationSeconds: number;
  } | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [markedReview, setMarkedReview] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [completedResult, setCompletedResult] = useState<PracticeTestResult | null>(null);

  // Auto-launch if triggered from Chapter Explorer, PYQs, or Question Bank
  useEffect(() => {
    if (!pendingTestLaunch) return;
    const qs = state.questions.filter((q) => pendingTestLaunch.questionIds.includes(q.id));
    if (qs.length > 0) {
      startSession({
        title: pendingTestLaunch.title,
        mode: pendingTestLaunch.mode,
        subjectId: pendingTestLaunch.subjectId,
        questions: qs,
        timed: pendingTestLaunch.timed,
        durationMinutes: pendingTestLaunch.durationMinutes,
      });
    }
    setPendingTestLaunch(null);
  }, [pendingTestLaunch]);

  // Countdown & elapsed timer
  useEffect(() => {
    if (!activeTest) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      if (activeTest.timed) {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            finalizeTest();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, answers, markedReview]);

  const objectiveQuestions = state.questions.filter((q) =>
    ['MCQ', 'MSQ', 'True/False', 'Fill in the Blanks'].includes(q.type)
  );

  const startSession = (cfg: {
    title: string;
    mode: PracticeTestResult['mode'];
    subjectId: string;
    questions: QuestionBankItem[];
    timed: boolean;
    durationMinutes: number;
  }) => {
    setCompletedResult(null);
    setActiveTest({
      title: cfg.title,
      mode: cfg.mode,
      subjectId: cfg.subjectId,
      questions: cfg.questions,
      timed: cfg.timed,
      durationSeconds: cfg.durationMinutes * 60,
    });
    setCurrentIdx(0);
    setAnswers({});
    setMarkedReview({});
    setSecondsLeft(cfg.durationMinutes * 60);
    setElapsedSeconds(0);
    setShowSubmitConfirm(false);
  };

  const handleLaunchBuilderTest = () => {
    let pool = objectiveQuestions;
    if (setupMode === 'Subject Test') {
      pool = objectiveQuestions.filter((q) => q.subjectId === selectedSubjectId);
    } else if (setupMode === 'Chapter Test') {
      pool = objectiveQuestions.filter(
        (q) =>
          q.subjectId === selectedSubjectId &&
          (selectedChapterId === 'all' || q.chapterId === selectedChapterId)
      );
    }
    if (pool.length === 0) pool = objectiveQuestions;
    const chosen = pool.slice(0, Math.max(1, maxQs));
    const subj = state.subjects.find((s) => s.id === selectedSubjectId);

    startSession({
      title:
        setupMode === 'Custom Test'
          ? `Custom Practice Test (${chosen.length} Qs)`
          : `${subj?.code || 'Study'} · ${setupMode}`,
      mode: setupMode,
      subjectId: selectedSubjectId,
      questions: chosen,
      timed: isTimed,
      durationMinutes: durationMins,
    });
  };

  const isAnswerCorrect = (q: QuestionBankItem, ans: string | string[] | undefined): boolean => {
    if (!ans) return false;
    if (q.type === 'MCQ' || q.type === 'True/False') return ans === q.correctAnswer;
    if (q.type === 'Fill in the Blanks') {
      return (
        typeof ans === 'string' &&
        ans.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase()
      );
    }
    if (q.type === 'MSQ') {
      const sel = Array.isArray(ans) ? [...ans].sort() : [];
      const exp = [...(q.correctAnswers || [])].sort();
      return sel.length === exp.length && sel.every((v, i) => v === exp[i]);
    }
    return false;
  };

  const finalizeTest = () => {
    if (!activeTest) return;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let score = 0;
    let maxScore = 0;

    const answersDetail: PracticeTestAnswerRecord[] = activeTest.questions.map((q) => {
      maxScore += q.marks;
      const ua = answers[q.id];
      const hasAnswer = Array.isArray(ua) ? ua.length > 0 : typeof ua === 'string' && ua.trim().length > 0;
      if (!hasAnswer) {
        unattempted += 1;
        return {
          questionId: q.id,
          userAnswer: ua || '',
          isCorrect: false,
          markedForReview: !!markedReview[q.id],
        };
      }
      const ok = isAnswerCorrect(q, ua);
      if (ok) {
        correct += 1;
        score += q.marks;
      } else {
        incorrect += 1;
      }
      return {
        questionId: q.id,
        userAnswer: ua,
        isCorrect: ok,
        markedForReview: !!markedReview[q.id],
      };
    });

    const accuracyPercent =
      correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

    const result: PracticeTestResult = {
      id: `test_${Date.now()}`,
      title: activeTest.title,
      mode: activeTest.mode,
      subjectId: activeTest.subjectId,
      date: new Date().toISOString().slice(0, 10),
      totalQuestions: activeTest.questions.length,
      correct,
      incorrect,
      unattempted,
      score,
      maxScore,
      accuracyPercent,
      timeTakenSeconds: elapsedSeconds,
      answersDetail,
    };

    saveTestResult(result);
    setCompletedResult(result);
    setActiveTest(null);
    setShowSubmitConfirm(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // VIEW 3: SCORECARD & ANALYSIS
  if (completedResult) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Test Submitted · Scorecard & Analysis
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {completedResult.title}
              </h2>
            </div>

            <button
              onClick={() => setCompletedResult(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Practice Test</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800">
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Total Score</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {completedResult.score}/{completedResult.maxScore}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800">
              <div className="text-[11px] text-emerald-600 font-semibold">Correct</div>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                {completedResult.correct}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800">
              <div className="text-[11px] text-rose-600 font-semibold">Incorrect</div>
              <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 tabular-nums mt-0.5">
                {completedResult.incorrect}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-semibold">Unattempted</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {completedResult.unattempted}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-800">
              <div className="text-[11px] text-orange-600 font-semibold">Accuracy</div>
              <div className="text-2xl font-extrabold text-orange-600 tabular-nums mt-0.5">
                {completedResult.accuracyPercent}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 font-semibold">Time Taken</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                {formatTime(completedResult.timeTakenSeconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-Question Review */}
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Answer Explanations & Review
          </h3>
          {completedResult.answersDetail.map((rec, idx) => {
            const q = state.questions.find((item) => item.id === rec.questionId);
            if (!q) return null;
            return (
              <div
                key={q.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">
                    Q{idx + 1} · {q.type} · {q.marks} marks
                  </span>
                  {rec.isCorrect ? (
                    <span className="text-emerald-600 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Correct
                    </span>
                  ) : (
                    <span className="text-rose-600 inline-flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {rec.userAnswer ? 'Incorrect' : 'Unattempted'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{q.question}</p>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div>
                    Your Answer:{' '}
                    <span className="font-semibold">
                      {Array.isArray(rec.userAnswer)
                        ? rec.userAnswer.join(', ') || 'None'
                        : rec.userAnswer || 'None'}
                    </span>
                  </div>
                  <div>
                    Correct Answer:{' '}
                    <span className="font-semibold text-emerald-600">
                      {q.correctAnswer || q.correctAnswers?.join(', ')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // VIEW 2: ACTIVE EXAM RUNNER
  if (activeTest) {
    const q = activeTest.questions[currentIdx];
    const currentAnswer = answers[q.id];
    const answeredCount = activeTest.questions.filter((item) => {
      const val = answers[item.id];
      return Array.isArray(val) ? val.length > 0 : typeof val === 'string' && val.trim().length > 0;
    }).length;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Question Area */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs font-bold text-blue-600">{activeTest.title}</div>
                <div className="text-xs text-slate-500 tabular-nums">
                  Question {currentIdx + 1} of {activeTest.questions.length} · {q.type} · {q.marks} marks
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold tabular-nums">
                  <Clock className={`w-3.5 h-3.5 ${activeTest.timed && secondsLeft < 60 ? 'text-rose-500' : 'text-blue-600'}`} />
                  <span>
                    {activeTest.timed ? `Left ${formatTime(secondsLeft)}` : `Elapsed ${formatTime(elapsedSeconds)}`}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
              {q.question}
            </h3>

            {(q.type === 'MCQ' || q.type === 'True/False') && q.options && (
              <div className="space-y-2.5">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                      currentAnswer === opt
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 font-semibold text-blue-900 dark:text-blue-100'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'MSQ' && q.options && (
              <div className="space-y-2.5">
                {q.options.map((opt) => {
                  const arr = Array.isArray(currentAnswer) ? currentAnswer : [];
                  const checked = arr.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer ${
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked ? arr.filter((x) => x !== opt) : [...arr, opt];
                          setAnswers((prev) => ({ ...prev, [q.id]: next }));
                        }}
                        className="mt-0.5 accent-blue-600"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === 'Fill in the Blanks' && (
              <input
                type="text"
                value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Enter your answer..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setMarkedReview((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  markedReview[q.id]
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{markedReview[q.id] ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              <button
                onClick={() =>
                  setAnswers((prev) => {
                    const copy = { ...prev };
                    delete copy[q.id];
                    return copy;
                  })
                }
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-xs font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentIdx < activeTest.questions.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentIdx((i) => Math.min(activeTest.questions.length - 1, i + 1))
                  }
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4 h-fit">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Question Palette
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {activeTest.questions.map((item, idx) => {
              const val = answers[item.id];
              const isAnswered = Array.isArray(val)
                ? val.length > 0
                : typeof val === 'string' && val.trim().length > 0;
              const isMarked = !!markedReview[item.id];
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded-xl text-xs font-bold tabular-nums border cursor-pointer transition-all ${
                    isCurrent ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                  } ${
                    isMarked
                      ? 'bg-orange-500 text-white border-orange-500'
                      : isAnswered
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 tabular-nums">
            <div>Answered: {answeredCount}/{activeTest.questions.length}</div>
            <div>Marked for Review: {Object.values(markedReview).filter(Boolean).length}</div>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
          >
            Finish & Submit Test
          </button>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-orange-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Submit Practice Test?
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                You have answered <span className="font-bold">{answeredCount}</span> out of{' '}
                <span className="font-bold">{activeTest.questions.length}</span> questions.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Continue Test
                </button>
                <button
                  onClick={finalizeTest}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 1: PRACTICE TEST BUILDER & HISTORY
  const selectedSubject = state.subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Test Configurator */}
      <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Practice Test System
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            Configure Timed or Untimed Practice Test
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Build chapter tests, full subject tests, or custom multi-subject mock assessments.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['Chapter Test', 'Subject Test', 'Custom Test'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSetupMode(m)}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${
                setupMode === m
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {setupMode !== 'Custom Test' && (
            <div>
              <label className="block text-xs font-semibold mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedChapterId('all');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {state.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {setupMode === 'Chapter Test' && selectedSubject && (
            <div>
              <label className="block text-xs font-semibold mb-1">Chapter</label>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="all">All Chapters</option>
                {selectedSubject.chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch {c.number}: {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">Number of Questions</label>
            <input
              type="number"
              min={1}
              max={objectiveQuestions.length}
              value={maxQs}
              onChange={(e) => setMaxQs(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Test Timing Mode</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTimed(true)}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  isTimed
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                Timed ({durationMins}m)
              </button>
              <button
                type="button"
                onClick={() => setIsTimed(false)}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  !isTimed
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                Untimed
              </button>
            </div>
          </div>

          {isTimed && (
            <div>
              <label className="block text-xs font-semibold mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min={2}
                max={180}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleLaunchBuilderTest}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Practice Test</span>
        </button>
      </div>

      {/* Saved Test History */}
      <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-orange-500" />
            <span>Test History ({state.testHistory.length})</span>
          </h3>
        </div>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {state.testHistory.length === 0 ? (
            <p className="text-xs text-slate-400">No tests completed yet.</p>
          ) : (
            state.testHistory.map((hist) => (
              <div
                key={hist.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{hist.mode}</span>
                  <span className="tabular-nums">{hist.date}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {hist.title}
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold tabular-nums pt-0.5">
                  <span className="text-blue-600">
                    Score: {hist.score}/{hist.maxScore}
                  </span>
                  <span className="text-orange-500">Accuracy: {hist.accuracyPercent}%</span>
                  <span className="text-slate-500">
                    {hist.correct}/{hist.totalQuestions} correct
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
