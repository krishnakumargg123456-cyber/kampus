import React, { useState } from 'react';
import {
  HelpCircle,
  Bookmark,
  CheckCircle2,
  XCircle,
  Sparkles,
  Play,
} from 'lucide-react';
import { useStudyHub } from '../../context/StudyHubContext';
import { DifficultyLevel, QuestionBankItem, QuestionType } from '../../types/studyHub';

interface QuestionBankViewProps {
  onOpenAi?: (prompt?: string) => void;
}

const QUESTION_TYPES: Array<'all' | QuestionType> = [
  'all',
  'MCQ',
  'MSQ',
  'True/False',
  'Fill in the Blanks',
  'Short Answer',
  'Long Answer',
];

const DIFFICULTIES: Array<'all' | DifficultyLevel> = ['all', 'Easy', 'Medium', 'Hard'];

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ onOpenAi }) => {
  const { state, toggleQuestionBookmark, launchPracticeTest } = useStudyHub();

  const [subjectFilter, setSubjectFilter] = useState('all');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>('all');
  const [diffFilter, setDiffFilter] = useState<'all' | DifficultyLevel>('all');
  const [importantOnly, setImportantOnly] = useState(false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  // Local interactive practice state per question
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const chaptersForSubject =
    subjectFilter === 'all'
      ? []
      : state.subjects.find((s) => s.id === subjectFilter)?.chapters || [];

  const filtered = state.questions.filter((q) => {
    const mSubj = subjectFilter === 'all' || q.subjectId === subjectFilter;
    const mChap = chapterFilter === 'all' || q.chapterId === chapterFilter;
    const mType = typeFilter === 'all' || q.type === typeFilter;
    const mDiff = diffFilter === 'all' || q.difficulty === diffFilter;
    const mImp = !importantOnly || q.isImportant;
    const mBook = !bookmarkedOnly || q.bookmarked;
    return mSubj && mChap && mType && mDiff && mImp && mBook;
  });

  const handleMsqToggle = (qId: string, option: string) => {
    const current = Array.isArray(userAnswers[qId]) ? (userAnswers[qId] as string[]) : [];
    const next = current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option];
    setUserAnswers((prev) => ({ ...prev, [qId]: next }));
  };

  const evaluateObjectiveAnswer = (q: QuestionBankItem): boolean | null => {
    const ans = userAnswers[q.id];
    if (!ans) return null;
    if (q.type === 'MCQ' || q.type === 'True/False') {
      return ans === q.correctAnswer;
    }
    if (q.type === 'Fill in the Blanks') {
      return (
        typeof ans === 'string' &&
        ans.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase()
      );
    }
    if (q.type === 'MSQ') {
      const selected = Array.isArray(ans) ? [...ans].sort() : [];
      const expected = [...(q.correctAnswers || [])].sort();
      return (
        selected.length === expected.length &&
        selected.every((v, idx) => v === expected[idx])
      );
    }
    return null;
  };

  const practiceableIds = filtered
    .filter((q) => ['MCQ', 'MSQ', 'True/False', 'Fill in the Blanks'].includes(q.type))
    .map((q) => q.id);

  return (
    <div className="space-y-5">
      {/* Header & Filters */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Structured Question Bank
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Practice MCQs, Multiple Select, True/False, Fill in the Blanks, Short & Long Answers with detailed explanations.
            </p>
          </div>
          {practiceableIds.length > 0 && (
            <button
              onClick={() =>
                launchPracticeTest({
                  title: `Question Bank Practice (${practiceableIds.length} Qs)`,
                  mode: 'Custom Test',
                  subjectId: subjectFilter,
                  questionIds: practiceableIds,
                  durationMinutes: Math.max(5, practiceableIds.length * 2),
                  timed: false,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice Filtered ({practiceableIds.length} Qs)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setChapterFilter('all');
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="all">All Subjects</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>

          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            disabled={subjectFilter === 'all'}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium disabled:opacity-50"
          >
            <option value="all">All Chapters</option>
            {chaptersForSubject.map((c) => (
              <option key={c.id} value={c.id}>
                Ch {c.number}: {c.title}
              </option>
            ))}
          </select>

          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value as 'all' | DifficultyLevel)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Difficulties' : d}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportantOnly(!importantOnly)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                importantOnly
                  ? 'bg-orange-50 border-orange-300 text-orange-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Important
            </button>
            <button
              onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                bookmarkedOnly
                  ? 'bg-blue-50 border-blue-300 text-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Bookmarked
            </button>
          </div>
        </div>

        {/* Question Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {QUESTION_TYPES.map((qt) => (
            <button
              key={qt}
              onClick={() => setTypeFilter(qt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                typeFilter === qt
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {qt === 'all' ? 'All Formats' : qt}
            </button>
          ))}
        </div>
      </div>

      {/* Question Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No questions match your current filters
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q, idx) => {
            const subj = state.subjects.find((s) => s.id === q.subjectId);
            const isRevealed = !!revealedIds[q.id];
            const evalResult = isRevealed ? evaluateObjectiveAnswer(q) : null;

            return (
              <div
                key={q.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      Q{idx + 1} · {q.type}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span
                      className={
                        q.difficulty === 'Hard'
                          ? 'text-orange-600'
                          : q.difficulty === 'Medium'
                          ? 'text-blue-600'
                          : 'text-emerald-600'
                      }
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">
                      {subj?.code} · {q.chapterName}
                    </span>
                    {q.isImportant && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-orange-600">Important</span>
                      </>
                    )}
                    {q.isPyq && q.pyqYear && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">PYQ {q.pyqYear}</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => toggleQuestionBookmark(q.id)}
                    className={`p-1.5 rounded-lg border cursor-pointer ${
                      q.bookmarked
                        ? 'bg-orange-50 border-orange-200 text-orange-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                    title="Bookmark question"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${q.bookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {q.question}
                </h3>

                {/* Interactive Answer Input by Question Type */}
                {(q.type === 'MCQ' || q.type === 'True/False') && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const selected = userAnswers[q.id] === opt;
                      const isCorrectOpt = isRevealed && q.correctAnswer === opt;
                      const isWrongSelected = isRevealed && selected && q.correctAnswer !== opt;
                      return (
                        <button
                          key={opt}
                          onClick={() =>
                            setUserAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                            isCorrectOpt
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : isWrongSelected
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-200'
                              : selected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-900 dark:text-blue-200 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'MSQ' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const selectedList = Array.isArray(userAnswers[q.id])
                        ? (userAnswers[q.id] as string[])
                        : [];
                      const checked = selectedList.includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer ${
                            checked
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleMsqToggle(q.id, opt)}
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
                    value={typeof userAnswers[q.id] === 'string' ? (userAnswers[q.id] as string) : ''}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="Type your exact answer..."
                    className="w-full sm:max-w-md px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:border-blue-600"
                  />
                )}

                {(q.type === 'Short Answer' || q.type === 'Long Answer') && (
                  <textarea
                    rows={q.type === 'Long Answer' ? 4 : 2}
                    value={typeof userAnswers[q.id] === 'string' ? (userAnswers[q.id] as string) : ''}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="Draft your structured answer here, then check against the model answer..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-hidden focus:border-blue-600"
                  />
                )}

                {/* Check / Reveal Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setRevealedIds((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {isRevealed ? 'Hide Explanation' : 'Check Answer & Explanation'}
                    </button>

                    {onOpenAi && (
                      <button
                        onClick={() =>
                          onOpenAi(`Explain the solution step-by-step for: ${q.question}`)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        <span>Explain with AI</span>
                      </button>
                    )}
                  </div>

                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                  </span>
                </div>

                {/* Explanation Drawer */}
                {isRevealed && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs sm:text-sm">
                    {evalResult !== null && (
                      <div
                        className={`flex items-center gap-1.5 font-bold ${
                          evalResult ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {evalResult ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct Answer!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>
                              Not quite — Correct answer:{' '}
                              {q.correctAnswer || q.correctAnswers?.join(' | ')}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {q.modelAnswer && (
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                          Model Answer:
                        </span>
                        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                          {q.modelAnswer}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                        Explanation:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
