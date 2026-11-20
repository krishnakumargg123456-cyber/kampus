import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Loader2,
  Plus,
  Radio,
  Sparkles,
  Square,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudyPartner } from '../../context/StudyPartnerContext';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';

export const SessionsAndGoalsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    scheduleSession,
    rescheduleSession,
    cancelSession,
    markSessionCompleted,
    launchSessionInStudyRoom,
    createGoal,
    toggleGoalTask,
    addGoalTask,
    markGoalCompleted,
    deleteGoal,
    prepareAiHandoff,
    runPartnerAiAssistant,
  } = useStudyPartner();

  // Session form state
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessTitle, setSessTitle] = useState('');
  const [sessTargetChoice, setSessTargetChoice] = useState(() => {
    if (state.connectedPartnerIds[0]) return `partner:${state.connectedPartnerIds[0]}`;
    if (state.groups[0]) return `group:${state.groups[0].id}`;
    return '';
  });
  const [sessSubject, setSessSubject] = useState(
    state.preferences.subjects[0] || 'Algorithms'
  );
  const [sessDate, setSessDate] = useState(
    new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  );
  const [sessTime, setSessTime] = useState('19:00');
  const [sessDuration, setSessDuration] = useState(50);
  const [sessObjective, setSessObjective] = useState('');
  const [sessNotes, setSessNotes] = useState('');

  // Reschedule inline state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Goal form state
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalSubject, setGoalSubject] = useState(
    state.preferences.subjects[0] || 'Algorithms'
  );
  const [goalTargetDate, setGoalTargetDate] = useState(
    new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)
  );
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTasksRaw, setGoalTasksRaw] = useState(
    'Complete chapter notes\nSolve 20 practice questions\nRun 1 peer mock quiz'
  );
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

  // Study Partner AI Assistant state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [customAiPrompt, setCustomAiPrompt] = useState('');

  const connectedPartners = state.peers.filter((p) =>
    state.connectedPartnerIds.includes(p.id)
  );

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessTitle.trim() || !sessTargetChoice) return;
    const [kind, id] = sessTargetChoice.split(':');
    const targetName =
      kind === 'group'
        ? state.groups.find((g) => g.id === id)?.name || 'Study Group'
        : state.peers.find((p) => p.id === id)?.name || 'Study Partner';

    scheduleSession({
      title: sessTitle,
      targetType: kind === 'group' ? 'group' : 'partner',
      targetId: id,
      targetName,
      subject: sessSubject,
      dateISO: sessDate,
      timeSlot: sessTime,
      durationMinutes: sessDuration,
      objectives: sessObjective || 'Focused collaborative problem-solving and review.',
      prepNotes: sessNotes || 'Bring textbook & practice problems.',
    });
    setSessTitle('');
    setSessObjective('');
    setSessNotes('');
    setShowSessionForm(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const memberIds = ['me', ...state.connectedPartnerIds.slice(0, 2)];
    createGoal({
      title: goalTitle,
      description: goalDesc || 'Shared accountability milestone with study partners.',
      subject: goalSubject,
      targetDate: goalTargetDate,
      assignedMemberIds: memberIds,
      tasks: goalTasksRaw.split('\n'),
    });
    setGoalTitle('');
    setGoalDesc('');
    setShowGoalForm(false);
  };

  const triggerAiAction = async (prompt: string) => {
    setAiLoading(true);
    setAiError(null);
    const res = await runPartnerAiAssistant(prompt);
    setAiLoading(false);
    if (res.ok && res.answer) {
      setAiResponse(res.answer);
    } else {
      setAiResponse(null);
      setAiError(
        res.error ||
          'KAMPUS AI backend service is currently unavailable or not configured.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: STUDY SESSION SCHEDULER */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Study Session Scheduler
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sessions automatically sync to KAMPUS Planner & Notification Center, and launch directly inside Virtual Study Rooms.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSessionForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showSessionForm ? 'Close Form' : 'Schedule Session'}</span>
          </button>
        </div>

        {showSessionForm && (
          <form
            onSubmit={handleScheduleSubmit}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={sessTitle}
                  onChange={(e) => setSessTitle(e.target.value)}
                  placeholder="e.g. DBMS BCNF & Concurrency Sprint"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Partner or Group *
                </label>
                <select
                  required
                  value={sessTargetChoice}
                  onChange={(e) => setSessTargetChoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                >
                  <option value="" disabled>
                    Select partner or group...
                  </option>
                  {connectedPartners.map((p) => (
                    <option key={p.id} value={`partner:${p.id}`}>
                      Partner: {p.name}
                    </option>
                  ))}
                  {state.groups.map((g) => (
                    <option key={g.id} value={`group:${g.id}`}>
                      Group: {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={sessSubject}
                  onChange={(e) => setSessSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={sessDate}
                  onChange={(e) => setSessDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={sessTime}
                  onChange={(e) => setSessTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration
                </label>
                <select
                  value={sessDuration}
                  onChange={(e) => setSessDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm tabular-nums"
                >
                  <option value={25}>25 minutes (Pomodoro)</option>
                  <option value={45}>45 minutes</option>
                  <option value={50}>50 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Objectives
                </label>
                <input
                  type="text"
                  value={sessObjective}
                  onChange={(e) => setSessObjective(e.target.value)}
                  placeholder="What problems, derivations, or chapters will you cover?"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preparation Notes
                </label>
                <input
                  type="text"
                  value={sessNotes}
                  onChange={(e) => setSessNotes(e.target.value)}
                  placeholder="Optional pre-reading..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSessionForm(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!sessTargetChoice}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold cursor-pointer"
              >
                Schedule & Sync to Planner
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {state.sessions.map((sess) => {
            const isUpcoming = sess.status === 'Upcoming' || sess.status === 'Live';
            return (
              <div
                key={sess.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tabular-nums">
                      <span
                        className={
                          sess.status === 'Completed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : sess.status === 'Cancelled'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }
                      >
                        {sess.status.toUpperCase()}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {sess.dateISO} at {sess.timeSlot} ({sess.durationMinutes} min)
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">{sess.subject}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      {sess.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      With <strong>{sess.targetName}</strong> · Objective: {sess.objectives}
                    </p>
                    {sess.prepNotes && (
                      <p className="text-[11px] text-slate-400">
                        Prep: {sess.prepNotes}
                      </p>
                    )}
                  </div>

                  {isUpcoming && (
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          launchSessionInStudyRoom({
                            roomName: sess.title,
                            subject: sess.subject,
                            objective: sess.objectives,
                            durationMinutes: sess.durationMinutes,
                            invitedPartners: [sess.targetName],
                            sessionId: sess.id,
                          });
                          navigate('/connect/study-rooms');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Join Room</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => markSessionCompleted(sess.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleId(sess.id);
                          setRescheduleDate(sess.dateISO);
                          setRescheduleTime(sess.timeSlot);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        Reschedule
                      </button>

                      <button
                        type="button"
                        onClick={() => cancelSession(sess.id)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {rescheduleId === sess.id && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        rescheduleSession(sess.id, rescheduleDate, rescheduleTime);
                        setRescheduleId(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Save New Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setRescheduleId(null)}
                      className="px-2 py-1.5 text-xs text-slate-500 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: COLLABORATIVE STUDY GOALS */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Collaborative Study Goals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shared milestones with task checklists tracked across you and your study partners.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGoalForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Target className="w-4 h-4" />
            <span>{showGoalForm ? 'Close Form' : 'New Shared Goal'}</span>
          </button>
        </div>

        {showGoalForm && (
          <form
            onSubmit={handleCreateGoal}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Solve 100 Physics Electrostatics Questions Together"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={goalSubject}
                  onChange={(e) => setGoalSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  placeholder="What does completion look like?"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Checklist Tasks (one per line)
                </label>
                <textarea
                  rows={3}
                  value={goalTasksRaw}
                  onChange={(e) => setGoalTasksRaw(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGoalForm(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Create Shared Goal
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {state.goals.map((goal) => {
            const doneCount = goal.tasks.filter((t) => t.completed).length;
            const totalCount = goal.tasks.length;
            const pct =
              totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            return (
              <div
                key={goal.id}
                className="p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                      {goal.subject} · Due {goal.targetDate} ·{' '}
                      <span
                        className={
                          goal.status === 'completed'
                            ? 'text-emerald-600'
                            : 'text-orange-600'
                        }
                      >
                        {goal.status === 'completed' ? 'COMPLETED' : 'ACTIVE'}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      {goal.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Members: {goal.assignedMemberNames.join(', ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteGoal(goal.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
                    <span className="text-slate-600 dark:text-slate-300">
                      {doneCount} of {totalCount} milestones done
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-blue-600 rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-1.5">
                  {goal.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleGoalTask(goal.id, task.id)}
                      className="w-full text-left flex items-center gap-2 text-xs py-1 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span
                        className={
                          task.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }
                      >
                        {task.text}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={newTaskInputs[goal.id] || ''}
                    onChange={(e) =>
                      setNewTaskInputs((prev) => ({
                        ...prev,
                        [goal.id]: e.target.value,
                      }))
                    }
                    placeholder="Add subtask..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = newTaskInputs[goal.id] || '';
                      if (!val.trim()) return;
                      addGoalTask(goal.id, val);
                      setNewTaskInputs((prev) => ({ ...prev, [goal.id]: '' }));
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                  {goal.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => markGoalCompleted(goal.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Complete All
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: KAMPUS AI STUDY PARTNER ASSISTANT */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Study Partner AI Assistant (Powered by KAMPUS AI)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uses only your authorized course subjects and shared goals. Never invents or fabricates offline answers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                prepareAiHandoff('quiz', {
                  subject: state.preferences.subjects[0] || 'Algorithms',
                  chapter: state.goals[0]?.title || 'Core Revision',
                  topic: state.preferences.subjects.slice(0, 2).join(', '),
                });
                navigate('/learn/kampus-ai');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer"
            >
              Group Practice Quiz in KAMPUS AI
            </button>
            <button
              type="button"
              onClick={() => {
                prepareAiHandoff('planner', {
                  goal: state.goals[0]?.title || 'Weekly partner study sprint',
                });
                navigate('/learn/kampus-ai');
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer"
            >
              Weekly Plan in KAMPUS AI
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            'Suggest 3 collaborative study goals for my subjects and exam timeline.',
            'Recommend 5 high-yield discussion topics for our next 50-minute partner sprint.',
            'Suggest a 4-day revision activity plan I can run with a study partner.',
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              disabled={aiLoading}
              onClick={() => triggerAiAction(preset)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!customAiPrompt.trim()) return;
            triggerAiAction(customAiPrompt);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={customAiPrompt}
            onChange={(e) => setCustomAiPrompt(e.target.value)}
            placeholder="Ask KAMPUS AI to suggest partner quiz questions, discussion agenda, or summary structure..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          />
          <button
            type="submit"
            disabled={aiLoading || !customAiPrompt.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 disabled:bg-slate-300 text-white text-xs font-semibold cursor-pointer"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CalendarClock className="w-4 h-4" />
            )}
            <span>Ask KAMPUS AI</span>
          </button>
        </form>

        {aiError && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </span>
            <button
              type="button"
              onClick={() => setAiError(null)}
              className="text-amber-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {aiResponse && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <MarkdownRenderer content={aiResponse} />
          </div>
        )}
      </section>
    </div>
  );
};
