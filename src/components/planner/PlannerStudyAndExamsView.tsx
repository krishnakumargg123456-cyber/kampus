import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlanner } from '../../context/PlannerContext';
import {
  CATEGORY_COLOR_MAP,
  EXAM_RECORD_TYPES,
  daysUntilDate,
  formatReadableDate,
  todayLocalISO,
} from '../../data/plannerData';
import type {
  ExamChecklistItem,
  ExamRecord,
  ExamRecordType,
  StudyPlanChapter,
  StudySessionRecord,
} from '../../types/planner';

interface Props {
  mode: 'study' | 'exams';
}

export const PlannerStudyAndExamsView: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const {
    studyPlans,
    studySessions,
    exams,
    createStudyPlan,
    updateStudyPlan,
    deleteStudyPlan,
    createStudySession,
    updateStudySession,
    deleteStudySession,
    createExam,
    updateExam,
    deleteExam,
  } = usePlanner();

  const todayISO = todayLocalISO();

  // Study Plan Creation State
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [courseOrClass, setCourseOrClass] = useState('B.Tech Computer Science');
  const [planSubject, setPlanSubject] = useState('');
  const [dailyHours, setDailyHours] = useState(2);
  const [planTargetDate, setPlanTargetDate] = useState(todayISO);

  // Add Chapter inline state per plan
  const [chapterInputs, setChapterInputs] = useState<
    Record<string, { title: string; kind: StudyPlanChapter['kind']; dateISO: string; minutes: number }>
  >({});

  // Study Session Creation / Reschedule State
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [sessSubject, setSessSubject] = useState('');
  const [sessTopic, setSessTopic] = useState('');
  const [sessDate, setSessDate] = useState(todayISO);
  const [sessStart, setSessStart] = useState('18:00');
  const [sessEnd, setSessEnd] = useState('19:00');
  const [sessMinutes, setSessMinutes] = useState(60);
  const [completingSessionId, setCompletingSessionId] = useState<string | null>(null);
  const [actualMinutesInput, setActualMinutesInput] = useState<number>(45);
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(todayISO);
  const [rescheduleStart, setRescheduleStart] = useState('18:00');
  const [rescheduleEnd, setRescheduleEnd] = useState('19:00');

  // Exams Creation & Editing State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examType, setExamType] = useState<ExamRecordType>('University Examination');
  const [examName, setExamName] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState(todayISO);
  const [examTime, setExamTime] = useState('09:30');
  const [examVenue, setExamVenue] = useState('');
  const [examChecklistDraft, setExamChecklistDraft] = useState('');
  const [newChecklistByExam, setNewChecklistByExam] = useState<Record<string, string>>({});

  const sortedSessions = useMemo(
    () =>
      [...studySessions].sort((a, b) =>
        `${b.dateISO} ${b.startTime}`.localeCompare(`${a.dateISO} ${a.startTime}`)
      ),
    [studySessions]
  );

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => `${a.dateISO} ${a.time}`.localeCompare(`${b.dateISO} ${b.time}`)),
    [exams]
  );

  const handleCreateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planSubject.trim()) return;
    await createStudyPlan({
      courseOrClass: courseOrClass.trim() || 'General Course',
      subject: planSubject.trim(),
      dailyAvailabilityHours: Number(dailyHours) || 2,
      targetDateISO: planTargetDate || todayISO,
      chapters: [],
    });
    setPlanSubject('');
    setIsPlanFormOpen(false);
  };

  const handleAddChapter = async (planId: string, existingChapters: StudyPlanChapter[]) => {
    const draft = chapterInputs[planId];
    if (!draft || !draft.title.trim()) return;
    const newChapter: StudyPlanChapter = {
      id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: draft.title.trim(),
      targetDateISO: draft.dateISO || todayISO,
      durationMinutes: Number(draft.minutes) || 45,
      kind: draft.kind || 'Study',
      completed: false,
    };
    await updateStudyPlan(planId, {
      chapters: [...existingChapters, newChapter],
    });
    setChapterInputs((prev) => ({
      ...prev,
      [planId]: { title: '', kind: 'Study', dateISO: todayISO, minutes: 45 },
    }));
  };

  const handleToggleChapter = async (
    planId: string,
    chapters: StudyPlanChapter[],
    chapterId: string
  ) => {
    await updateStudyPlan(planId, {
      chapters: chapters.map((c) => (c.id === chapterId ? { ...c, completed: !c.completed } : c)),
    });
  };

  const handleCreateStudySession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessSubject.trim()) return;
    await createStudySession({
      subject: sessSubject.trim(),
      chapterOrTopic: sessTopic.trim() || 'Focused Study Block',
      dateISO: sessDate,
      startTime: sessStart,
      endTime: sessEnd,
      plannedMinutes: Number(sessMinutes) || 45,
      actualMinutes: 0,
      status: 'Planned',
    });
    setSessSubject('');
    setSessTopic('');
    setIsSessionFormOpen(false);
  };

  const handleCompleteSession = async (session: StudySessionRecord) => {
    await updateStudySession(session.id, {
      status: 'Completed',
      actualMinutes: Math.max(1, Number(actualMinutesInput) || session.plannedMinutes),
    });
    setCompletingSessionId(null);
  };

  const handleConfirmReschedule = async (session: StudySessionRecord) => {
    await updateStudySession(session.id, {
      dateISO: rescheduleDate,
      startTime: rescheduleStart,
      endTime: rescheduleEnd,
      status: 'Rescheduled',
    });
    setRescheduleSessionId(null);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) return;
    const checklist: ExamChecklistItem[] = examChecklistDraft
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title, idx) => ({
        id: `exchk_${Date.now()}_${idx}`,
        title,
        done: false,
      }));
    await createExam({
      examType,
      name: examName.trim(),
      subject: examSubject.trim() || examName.trim(),
      dateISO: examDate || todayISO,
      time: examTime || '09:30',
      venue: examVenue.trim() || 'To be announced',
      prepStatus: 'Not Started',
      checklist,
    });
    setExamName('');
    setExamSubject('');
    setExamVenue('');
    setExamChecklistDraft('');
    setIsExamModalOpen(false);
  };

  const handleAddExamChecklistItem = async (exam: ExamRecord) => {
    const text = (newChecklistByExam[exam.id] || '').trim();
    if (!text) return;
    const updated: ExamChecklistItem[] = [
      ...exam.checklist,
      { id: `exchk_${Date.now()}`, title: text, done: false },
    ];
    await updateExam(exam.id, { checklist: updated });
    setNewChecklistByExam((prev) => ({ ...prev, [exam.id]: '' }));
  };

  if (mode === 'study') {
    const totalStudyMinutesRecorded = studySessions
      .filter((s) => s.status === 'Completed')
      .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

    return (
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Study Planner & Session Tracker</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {studyPlans.length} active plan(s) · {totalStudyMinutesRecorded} actual study mins recorded
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/learn/study-hub')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Study Hub</span>
            </button>
            <button
              onClick={() => setIsSessionFormOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-xs font-semibold text-blue-700 dark:text-blue-300"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </button>
            <button
              onClick={() => setIsPlanFormOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>New Study Plan</span>
            </button>
          </div>
        </div>

        {/* Create Study Plan Form */}
        {isPlanFormOpen && (
          <form
            onSubmit={handleCreateStudyPlan}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Course Study Plan</h3>
              <button type="button" onClick={() => setIsPlanFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Course / Program</label>
                <input
                  type="text"
                  value={courseOrClass}
                  onChange={(e) => setCourseOrClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  placeholder="e.g., B.Tech CSE Sem 4"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={planSubject}
                  onChange={(e) => setPlanSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  placeholder="e.g., Operating Systems"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Daily Availability (hrs)</label>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={planTargetDate}
                  onChange={(e) => setPlanTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPlanFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Save Study Plan
              </button>
            </div>
          </form>
        )}

        {/* Schedule Study Session Form */}
        {isSessionFormOpen && (
          <form
            onSubmit={handleCreateStudySession}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Schedule Study Session</h3>
              <button type="button" onClick={() => setIsSessionFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={sessSubject}
                  onChange={(e) => setSessSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  placeholder="e.g., Data Structures"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Chapter / Topic</label>
                <input
                  type="text"
                  value={sessTopic}
                  onChange={(e) => setSessTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  placeholder="e.g., AVL Trees & Graph Traversal"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Planned Duration (mins)</label>
                <input
                  type="number"
                  min={10}
                  max={360}
                  value={sessMinutes}
                  onChange={(e) => setSessMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={sessDate}
                  onChange={(e) => setSessDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Start Time</label>
                <input
                  type="time"
                  value={sessStart}
                  onChange={(e) => setSessStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">End Time</label>
                <input
                  type="time"
                  value={sessEnd}
                  onChange={(e) => setSessEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSessionFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Add Session
              </button>
            </div>
          </form>
        )}

        {/* Study Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subject Study Plans
            </h3>
            {studyPlans.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No study plans created yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Break subjects into chapters, revision blocks, and practice tests with target dates.
                </p>
                <button
                  onClick={() => setIsPlanFormOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Study Plan</span>
                </button>
              </div>
            ) : (
              studyPlans.map((plan) => {
                const doneCount = plan.chapters.filter((c) => c.completed).length;
                const pct = plan.chapters.length ? Math.round((doneCount / plan.chapters.length) * 100) : 0;
                const chDraft = chapterInputs[plan.id] || {
                  title: '',
                  kind: 'Study' as StudyPlanChapter['kind'],
                  dateISO: todayISO,
                  minutes: 45,
                };
                return (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {plan.courseOrClass}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{plan.subject}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                          {plan.dailyAvailabilityHours}h/day · Target {formatReadableDate(plan.targetDateISO)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">{pct}%</span>
                        <button
                          onClick={() => deleteStudyPlan(plan.id)}
                          aria-label="Delete study plan"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>

                    {/* Chapters list */}
                    <div className="space-y-2">
                      {plan.chapters.map((ch) => (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70"
                        >
                          <button
                            onClick={() => handleToggleChapter(plan.id, plan.chapters, ch.id)}
                            className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                          >
                            {ch.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  ch.completed
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-800 dark:text-slate-100'
                                }`}
                              >
                                {ch.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                {ch.kind} · {ch.durationMinutes}m · {formatReadableDate(ch.targetDateISO)}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setSessSubject(plan.subject);
                              setSessTopic(ch.title);
                              setSessDate(ch.targetDateISO || todayISO);
                              setSessMinutes(ch.durationMinutes || 45);
                              setIsSessionFormOpen(true);
                            }}
                            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                          >
                            Schedule
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add chapter row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        value={chDraft.title}
                        onChange={(e) =>
                          setChapterInputs((prev) => ({
                            ...prev,
                            [plan.id]: { ...chDraft, title: e.target.value },
                          }))
                        }
                        placeholder="Add chapter or topic..."
                        className="sm:col-span-5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                      <select
                        value={chDraft.kind}
                        onChange={(e) =>
                          setChapterInputs((prev) => ({
                            ...prev,
                            [plan.id]: { ...chDraft, kind: e.target.value as StudyPlanChapter['kind'] },
                          }))
                        }
                        className="sm:col-span-3 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Study">Study</option>
                        <option value="Revision">Revision</option>
                        <option value="Practice Test">Practice Test</option>
                      </select>
                      <input
                        type="number"
                        min={15}
                        max={240}
                        value={chDraft.minutes}
                        onChange={(e) =>
                          setChapterInputs((prev) => ({
                            ...prev,
                            [plan.id]: { ...chDraft, minutes: Number(e.target.value) },
                          }))
                        }
                        className="sm:col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChapter(plan.id, plan.chapters)}
                        className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Study Sessions Tracker */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Study Sessions (Planned vs Actual)
            </h3>
            {sortedSessions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No study sessions scheduled</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Actual minutes are only logged once you complete a session.
                </p>
                <button
                  onClick={() => setIsSessionFormOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Study Session</span>
                </button>
              </div>
            ) : (
              sortedSessions.map((sess) => {
                const isCompleting = completingSessionId === sess.id;
                const isRescheduling = rescheduleSessionId === sess.id;
                return (
                  <div
                    key={sess.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className={CATEGORY_COLOR_MAP.Study.text}>{sess.subject}</span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span
                            className={
                              sess.status === 'Completed'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : sess.status === 'In Progress'
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            {sess.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{sess.chapterOrTopic}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                          {formatReadableDate(sess.dateISO)} · {sess.startTime}–{sess.endTime} · Planned {sess.plannedMinutes}m
                          {sess.status === 'Completed' ? ` · Actual ${sess.actualMinutes}m` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteStudySession(sess.id)}
                        aria-label="Delete study session"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {sess.status !== 'Completed' && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {sess.status !== 'In Progress' && (
                          <button
                            onClick={() => updateStudySession(sess.id, { status: 'In Progress' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setCompletingSessionId(sess.id);
                            setActualMinutesInput(sess.plannedMinutes);
                            setRescheduleSessionId(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => {
                            setRescheduleSessionId(sess.id);
                            setRescheduleDate(sess.dateISO);
                            setRescheduleStart(sess.startTime);
                            setRescheduleEnd(sess.endTime);
                            setCompletingSessionId(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reschedule</span>
                        </button>
                      </div>
                    )}

                    {isCompleting && (
                      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <label className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                          Actual mins studied:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={480}
                          value={actualMinutesInput}
                          onChange={(e) => setActualMinutesInput(Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs tabular-nums"
                        />
                        <button
                          onClick={() => handleCompleteSession(sess)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Confirm Log
                        </button>
                        <button
                          onClick={() => setCompletingSessionId(null)}
                          className="px-2 py-1 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {isRescheduling && (
                      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs tabular-nums"
                        />
                        <input
                          type="time"
                          value={rescheduleStart}
                          onChange={(e) => setRescheduleStart(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs tabular-nums"
                        />
                        <input
                          type="time"
                          value={rescheduleEnd}
                          onChange={(e) => setRescheduleEnd(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs tabular-nums"
                        />
                        <button
                          onClick={() => handleConfirmReschedule(sess)}
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRescheduleSessionId(null)}
                          className="px-2 py-1 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // EXAMS & DEADLINES MODE
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-rose-600" />
            <span>Exam & Academic Deadline Tracker</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {exams.length} exam(s) & milestone deadlines tracked with readiness checklists
          </p>
        </div>
        <button
          onClick={() => setIsExamModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Track Exam / Deadline</span>
        </button>
      </div>

      {isExamModalOpen && (
        <form
          onSubmit={handleCreateExam}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Exam or Official Deadline</h3>
            <button type="button" onClick={() => setIsExamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamRecordType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              >
                {EXAM_RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Title / Exam Name *</label>
              <input
                type="text"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                placeholder="e.g., End-Sem Algorithms Paper"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Subject / Course</label>
              <input
                type="text"
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                placeholder="e.g., CS301"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Time</label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Venue / Portal</label>
              <input
                type="text"
                value={examVenue}
                onChange={(e) => setExamVenue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                placeholder="e.g., Examination Hall B / Portal"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Initial Prep Checklist (one item per line)
            </label>
            <textarea
              rows={3}
              value={examChecklistDraft}
              onChange={(e) => setExamChecklistDraft(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              placeholder={'Revise Unit 1–3 notes\nSolve 2 past question papers\nVerify hall ticket in Digital Locker'}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Save Exam Record
            </button>
          </div>
        </form>
      )}

      {sortedExams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center">
          <CalendarClock className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No exams or major deadlines tracked yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add board, university, competitive, practical exams, or admission deadlines to get live countdowns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedExams.map((exam) => {
            const daysLeft = daysUntilDate(exam.dateISO);
            const countdownLabel =
              daysLeft === 0
                ? 'Today'
                : daysLeft === 1
                ? 'Tomorrow'
                : daysLeft > 1
                ? `In ${daysLeft} days`
                : `${Math.abs(daysLeft)} days ago`;
            const doneChk = exam.checklist.filter((c) => c.done).length;
            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {exam.examType}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{exam.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Subject: {exam.subject}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
                        daysLeft <= 3 && daysLeft >= 0
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {countdownLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                    {formatReadableDate(exam.dateISO)} at {exam.time}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {exam.venue}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Readiness Status:</label>
                  <select
                    value={exam.prepStatus}
                    onChange={(e) =>
                      updateExam(exam.id, { prepStatus: e.target.value as ExamRecord['prepStatus'] })
                    }
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Ready">Ready</option>
                  </select>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>Preparation Checklist</span>
                    <span>
                      {doneChk}/{exam.checklist.length}
                    </span>
                  </div>
                  {exam.checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          updateExam(exam.id, {
                            checklist: exam.checklist.map((c) =>
                              c.id === item.id ? { ...c, done: !c.done } : c
                            ),
                          })
                        }
                        className="flex items-center gap-2 text-left flex-1 min-w-0"
                      >
                        {item.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            item.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {item.title}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          updateExam(exam.id, {
                            checklist: exam.checklist.filter((c) => c.id !== item.id),
                          })
                        }
                        className="text-slate-400 hover:text-rose-500"
                        aria-label="Remove checklist item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newChecklistByExam[exam.id] || ''}
                      onChange={(e) =>
                        setNewChecklistByExam((prev) => ({ ...prev, [exam.id]: e.target.value }))
                      }
                      placeholder="Add prep step..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddExamChecklistItem(exam)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExam(exam.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                      aria-label="Delete exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
