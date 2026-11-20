import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Mic,
  MicOff,
  Play,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useCareer } from '../../context/CareerContext';
import {
  ASSESSMENT_CATEGORIES,
  ASSESSMENT_QUESTIONS,
  INTERVIEW_QUESTIONS,
  formatShortDate,
} from '../../data/careerData';
import type {
  AssessmentCategory,
  InterviewQuestion,
  InterviewType,
} from '../../types/career';

const INTERVIEW_TYPES: InterviewType[] = [
  'HR Interview',
  'Technical Interview',
  'Behavioral Interview',
  'Internship Interview',
  'Campus Placement Interview',
  'General Fresher Interview',
];

export const InterviewAndAssessmentsView: React.FC = () => {
  const {
    interviewHistory,
    assessmentAttempts,
    logInterviewPractice,
    logAssessmentAttempt,
    evaluateInterviewAnswerAi,
    showToast,
  } = useCareer();

  const [modeTab, setModeTab] = useState<'interview' | 'assessments'>('interview');

  // Interview Prep State
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedDiff, setSelectedDiff] = useState<string>('All');
  const [activeQuestion, setActiveQuestion] = useState<InterviewQuestion>(INTERVIEW_QUESTIONS[0]);
  const [answerText, setAnswerText] = useState('');
  const [showStructure, setShowStructure] = useState(false);
  const [aiEvalBusy, setAiEvalBusy] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<
    (Awaited<ReturnType<typeof evaluateInterviewAnswerAi>>) | null
  >(null);
  const [mockRunning, setMockRunning] = useState(false);
  const [mockIndex, setMockIndex] = useState(0);

  // Voice Dictation (Web Speech API)
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Assessment State
  const [assmCategory, setAssmCategory] = useState<AssessmentCategory>('Programming');
  const [assmMode, setAssmMode] = useState<'Timed' | 'Untimed'>('Untimed');
  const [assmStarted, setAssmStarted] = useState(false);
  const [assmSubmitted, setAssmSubmitted] = useState(false);
  const [assmAnswers, setAssmAnswers] = useState<Record<string, number>>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!assmStarted || assmSubmitted) return;
    const iv = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, [assmStarted, assmSubmitted]);

  const filteredQuestions = useMemo(
    () =>
      INTERVIEW_QUESTIONS.filter(
        (q) =>
          (selectedType === 'All' || q.interviewType === selectedType) &&
          (selectedDiff === 'All' || q.difficulty === selectedDiff)
      ),
    [selectedType, selectedDiff]
  );

  const toggleVoiceDictation = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('info', 'Voice dictation is not supported in this browser — type your answer directly.');
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        setAnswerText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const handleSaveAndEvaluate = async (requestAi: boolean) => {
    if (!answerText.trim()) {
      showToast('error', 'Enter or dictate your practice response first.');
      return;
    }
    let fb: Awaited<ReturnType<typeof evaluateInterviewAnswerAi>> | undefined;
    if (requestAi) {
      setAiEvalBusy(true);
      try {
        fb = await evaluateInterviewAnswerAi(
          activeQuestion.prompt,
          answerText,
          activeQuestion.interviewType
        );
        setLatestFeedback(fb);
      } finally {
        setAiEvalBusy(false);
      }
    }
    await logInterviewPractice({
      questionId: activeQuestion.id,
      questionPrompt: activeQuestion.prompt,
      interviewType: activeQuestion.interviewType,
      answerText,
      aiFeedback: fb,
    });
    if (mockRunning) {
      const nextIdx = mockIndex + 1;
      if (nextIdx < INTERVIEW_QUESTIONS.length) {
        setMockIndex(nextIdx);
        setActiveQuestion(INTERVIEW_QUESTIONS[nextIdx]);
        setAnswerText('');
        setShowStructure(false);
      } else {
        setMockRunning(false);
        showToast('success', 'Mock interview sequence completed and saved to history.');
      }
    }
  };

  const activeQuizQuestions = useMemo(
    () => ASSESSMENT_QUESTIONS.filter((q) => q.category === assmCategory),
    [assmCategory]
  );

  const startAssessment = () => {
    setAssmAnswers({});
    setSecondsElapsed(0);
    setAssmSubmitted(false);
    setAssmStarted(true);
  };

  const submitAssessment = async () => {
    const total = activeQuizQuestions.length;
    let correct = 0;
    const weak: string[] = [];
    activeQuizQuestions.forEach((q) => {
      if (assmAnswers[q.id] === q.correctIndex) {
        correct += 1;
      } else {
        weak.push(q.topic);
      }
    });
    setAssmSubmitted(true);
    await logAssessmentAttempt({
      category: assmCategory,
      mode: assmMode,
      totalQuestions: total,
      correctCount: correct,
      weakTopics: Array.from(new Set(weak)),
      durationSeconds: secondsElapsed,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Interview Preparation & Skill Assessments
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Practice real interview structures, request labeled AI guidance, and take timed or untimed skill assessments.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setModeTab('interview')}
            className={`px-3.5 py-1.5 rounded-lg cursor-pointer ${
              modeTab === 'interview' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Interview Prep (6 Types)
          </button>
          <button
            type="button"
            onClick={() => setModeTab('assessments')}
            className={`px-3.5 py-1.5 rounded-lg cursor-pointer ${
              modeTab === 'assessments' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Skill Assessments (7 Categories)
          </button>
        </div>
      </div>

      {modeTab === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Question Bank */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172033] dark:text-slate-100">Question Bank</span>
                <button
                  type="button"
                  onClick={() => {
                    setMockRunning(true);
                    setMockIndex(0);
                    setActiveQuestion(INTERVIEW_QUESTIONS[0]);
                    setAnswerText('');
                    setLatestFeedback(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563EB] text-white font-semibold cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Start Mock Session</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="All">All 6 Interview Types</option>
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDiff}
                  onChange={(e) => setSelectedDiff(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {filteredQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setActiveQuestion(q);
                    setShowStructure(false);
                    setLatestFeedback(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    activeQuestion.id === q.id
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#2563EB]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-[#2563EB]">
                    {q.interviewType} · {q.difficulty} · {q.topic}
                  </div>
                  <div className="text-xs font-bold text-[#172033] dark:text-slate-100 mt-1">
                    {q.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Practice Workspace + History */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2563EB]">
                  {mockRunning
                    ? `Mock Interview · Question ${mockIndex + 1} of ${INTERVIEW_QUESTIONS.length}`
                    : `${activeQuestion.interviewType} · ${activeQuestion.role}`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowStructure((s) => !s)}
                  className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer"
                >
                  {showStructure ? 'Hide Suggested Structure' : 'Reveal Suggested Structure'}
                </button>
              </div>

              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                {activeQuestion.prompt}
              </h3>

              {showStructure && (
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 text-xs space-y-1">
                  <div className="font-bold text-[#172033] dark:text-slate-100">
                    Suggested Answer Structure
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[#64748B] dark:text-slate-300">
                    {activeQuestion.suggestedStructure.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Your Practice Response</span>
                  <button
                    type="button"
                    onClick={toggleVoiceDictation}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                      listening
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#172033] dark:text-slate-200'
                    }`}
                  >
                    {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{listening ? 'Stop Dictation' : 'Voice Input (Mic)'}</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Write or dictate your response using STAR or clear problem breakdown..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveAndEvaluate(false)}
                  className="px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Save Practice Answer
                </button>
                <button
                  type="button"
                  disabled={aiEvalBusy}
                  onClick={() => void handleSaveAndEvaluate(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiEvalBusy ? 'Generating Guidance...' : 'Save & Get AI Feedback'}</span>
                </button>
              </div>

              {latestFeedback && (
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="font-bold text-[#2563EB]">
                    {latestFeedback.sourceLabel} (Practice Guidance Only — Not a Hiring Evaluation)
                  </div>
                  <div>
                    <strong>Clarity:</strong> {latestFeedback.clarity}
                  </div>
                  <div>
                    <strong>Structure Suggestions:</strong> {latestFeedback.structureSuggestions.join(' ')}
                  </div>
                  <div>
                    <strong>Missing Concepts:</strong> {latestFeedback.missingConcepts.join(' ')}
                  </div>
                  <div>
                    <strong>Follow-Up Questions to Rehearse:</strong>{' '}
                    {latestFeedback.followUpQuestions.join(' | ')}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="font-bold text-sm text-[#172033] dark:text-slate-100">
                Practice History ({interviewHistory.length})
              </div>
              {interviewHistory.length === 0 ? (
                <p className="text-[#64748B]">No saved interview practice entries yet.</p>
              ) : (
                <div className="space-y-2">
                  {interviewHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1"
                    >
                      <div className="font-semibold text-[#2563EB]">
                        {item.interviewType} · {formatShortDate(item.createdAt)}
                      </div>
                      <div className="font-bold text-[#172033] dark:text-slate-100">
                        {item.questionPrompt}
                      </div>
                      <p className="text-[#64748B] dark:text-slate-300 line-clamp-2">
                        {item.answerText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modeTab === 'assessments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="text-xs font-semibold text-[#2563EB]">
                  Sample Practice Assessments (Unverified Self-Check Bank)
                </div>
                <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100">
                  {assmCategory}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={assmCategory}
                  onChange={(e) => {
                    setAssmCategory(e.target.value as AssessmentCategory);
                    setAssmStarted(false);
                    setAssmSubmitted(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  {ASSESSMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={assmMode}
                  onChange={(e) => setAssmMode(e.target.value as 'Timed' | 'Untimed')}
                  disabled={assmStarted}
                  className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value="Untimed">Untimed Practice</option>
                  <option value="Timed">Timed Practice</option>
                </select>
              </div>
            </div>

            {!assmStarted ? (
              <div className="py-6 text-center space-y-3">
                <ClipboardCheck className="w-10 h-10 text-[#2563EB] mx-auto" />
                <p className="text-sm font-semibold text-[#172033] dark:text-slate-100">
                  {activeQuizQuestions.length} sample practice questions ready in {assmCategory} ({assmMode} mode).
                </p>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Instant answer explanations and weak-topic tracking are provided after submission.
                </p>
                <button
                  type="button"
                  onClick={startAssessment}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Start Practice Assessment
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {assmMode === 'Timed' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 text-xs font-semibold tabular-nums">
                    <Timer className="w-3.5 h-3.5 text-[#F97316]" />
                    <span>Elapsed: {secondsElapsed}s</span>
                  </div>
                )}

                {activeQuizQuestions.map((q, idx) => {
                  const chosen = assmAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="text-[11px] font-semibold text-[#64748B]">
                        Question {idx + 1} · {q.topic} · {q.difficulty} ({q.sourceLabel})
                      </div>
                      <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                        {q.question}
                      </div>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = chosen === oIdx;
                          const isCorrect = q.correctIndex === oIdx;
                          return (
                            <label
                              key={oIdx}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                                assmSubmitted
                                  ? isCorrect
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                                    : isSelected
                                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
                                    : 'border-slate-200 dark:border-slate-700'
                                  : isSelected
                                  ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/30'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                disabled={assmSubmitted}
                                checked={isSelected}
                                onChange={() => setAssmAnswers({ ...assmAnswers, [q.id]: oIdx })}
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                      {assmSubmitted && (
                        <div className="text-xs text-[#172033] dark:text-slate-200 pt-1">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!assmSubmitted ? (
                  <button
                    type="button"
                    onClick={() => void submitAssessment()}
                    className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
                  >
                    Submit & View Explanations
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startAssessment}
                    className="px-5 py-2.5 rounded-xl bg-[#172554] text-white text-xs font-semibold cursor-pointer"
                  >
                    Retry Assessment
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Attempt History & Weak Topics */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              Attempt History & Weak Topics
            </h3>
            {assessmentAttempts.length === 0 ? (
              <p className="text-[#64748B]">Complete a practice assessment to track weak topics.</p>
            ) : (
              <div className="space-y-2.5">
                {assessmentAttempts.slice(0, 6).map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{att.category}</span>
                      <span className="tabular-nums text-[#2563EB]">
                        {att.correctCount}/{att.totalQuestions}
                      </span>
                    </div>
                    <div className="text-[#64748B] dark:text-slate-400">
                      {att.mode} · {att.durationSeconds}s · {formatShortDate(att.createdAt)}
                    </div>
                    {att.weakTopics.length > 0 && (
                      <div className="text-amber-600 dark:text-amber-400">
                        Review: {att.weakTopics.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
