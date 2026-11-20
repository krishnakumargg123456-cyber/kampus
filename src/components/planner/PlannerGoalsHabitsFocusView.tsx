import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Flame,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Target,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import {
  FOCUS_PRESETS,
  GOAL_CATEGORIES,
  TASK_PRIORITIES,
  addDaysToISO,
  computeHabitStreak,
  formatReadableDate,
  todayLocalISO,
} from '../../data/plannerData';
import type { GoalCategory, GoalMilestone, PlannerGoal, TaskPriority } from '../../types/planner';

interface Props {
  mode: 'goals' | 'habits' | 'focus';
}

export const PlannerGoalsHabitsFocusView: React.FC<Props> = ({ mode }) => {
  const {
    goals,
    habits,
    focusSessions,
    createGoal,
    updateGoal,
    deleteGoal,
    createHabit,
    toggleHabitDate,
    deleteHabit,
    logFocusSession,
  } = usePlanner();

  const todayISO = todayLocalISO();

  // Goals state
  const [goalFilter, setGoalFilter] = useState<'All' | GoalCategory>('All');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('Academic Goals');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState(todayISO);
  const [goalPriority, setGoalPriority] = useState<TaskPriority>('High');
  const [goalMilestonesDraft, setGoalMilestonesDraft] = useState('');
  const [newMilestoneByGoal, setNewMilestoneByGoal] = useState<Record<string, string>>({});

  // Habits state
  const [habitName, setHabitName] = useState('');
  const [habitNote, setHabitNote] = useState('');
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  // Focus Mode state
  const [selectedPresetLabel, setSelectedPresetLabel] = useState(FOCUS_PRESETS[0].label);
  const [focusModeType, setFocusModeType] = useState<'Focus' | 'Short Break' | 'Long Break'>('Focus');
  const [plannedMinutes, setPlannedMinutes] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusNotes, setFocusNotes] = useState('');
  const [confirmEarlyNotice, setConfirmEarlyNotice] = useState(false);
  const completedNaturallyRef = useRef(false);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setIsRunning(false);
          completedNaturallyRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && completedNaturallyRef.current) {
      completedNaturallyRef.current = false;
      void logFocusSession({
        mode: focusModeType,
        presetLabel: selectedPresetLabel,
        plannedMinutes,
        actualMinutes: plannedMinutes,
        notes: focusNotes.trim(),
        confirmed: true,
      });
    }
  }, [secondsLeft, focusModeType, selectedPresetLabel, plannedMinutes, focusNotes, logFocusSession]);

  const selectPreset = (label: string, mins: number, mType: 'Focus' | 'Short Break' | 'Long Break') => {
    setIsRunning(false);
    completedNaturallyRef.current = false;
    setSelectedPresetLabel(label);
    setFocusModeType(mType);
    setPlannedMinutes(mins);
    setSecondsLeft(mins * 60);
    setConfirmEarlyNotice(false);
  };

  const applyCustomTimer = () => {
    const valid = Math.max(1, Math.min(180, Number(customMinutes) || 25));
    selectPreset(`${valid} min Custom`, valid, 'Focus');
  };

  const elapsedSeconds = Math.max(0, plannedMinutes * 60 - secondsLeft);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  const handleExplicitCompleteSession = async () => {
    if (elapsedSeconds < 60 && !confirmEarlyNotice) {
      setConfirmEarlyNotice(true);
      return;
    }
    setIsRunning(false);
    completedNaturallyRef.current = false;
    const recordedMins = Math.max(1, Math.round(elapsedSeconds / 60));
    await logFocusSession({
      mode: focusModeType,
      presetLabel: selectedPresetLabel,
      plannedMinutes,
      actualMinutes: recordedMins,
      notes: focusNotes.trim(),
      confirmed: true,
    });
    setConfirmEarlyNotice(false);
    setSecondsLeft(plannedMinutes * 60);
    setFocusNotes('');
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const milestones: GoalMilestone[] = goalMilestonesDraft
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((title, idx) => ({
        id: `ms_${Date.now()}_${idx}`,
        title,
        completed: false,
      }));
    await createGoal({
      title: goalTitle.trim(),
      category: goalCategory,
      description: goalDesc.trim(),
      targetDateISO: goalTargetDate || todayISO,
      priority: goalPriority,
      status: 'Active',
      milestones,
    });
    setGoalTitle('');
    setGoalDesc('');
    setGoalMilestonesDraft('');
    setIsGoalModalOpen(false);
  };

  const handleAddMilestone = async (goal: PlannerGoal) => {
    const title = (newMilestoneByGoal[goal.id] || '').trim();
    if (!title) return;
    const nextMilestones: GoalMilestone[] = [
      ...goal.milestones,
      { id: `ms_${Date.now()}`, title, completed: false },
    ];
    await updateGoal(goal.id, { milestones: nextMilestones });
    setNewMilestoneByGoal((prev) => ({ ...prev, [goal.id]: '' }));
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    await createHabit(habitName.trim(), habitNote.trim());
    setHabitName('');
    setHabitNote('');
  };

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDaysToISO(todayISO, i - 6));
  }, [todayISO]);

  const last28Days = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => addDaysToISO(todayISO, i - 27));
  }, [todayISO]);

  if (mode === 'goals') {
    const filteredGoals = goals.filter((g) => goalFilter === 'All' || g.category === goalFilter);
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Goals & Milestones</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {goals.filter((g) => g.status === 'Active').length} active ·{' '}
              {goals.filter((g) => g.status === 'Completed').length} completed
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value as 'All' | GoalCategory)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Categories</option>
              {GOAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsGoalModalOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>
          </div>
        </div>

        {isGoalModalOpen && (
          <form
            onSubmit={handleCreateGoal}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Define New Goal</h3>
              <button type="button" onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  placeholder="e.g., Score 9.0+ SGPA this semester"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value as GoalCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  {GOAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white tabular-nums"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  placeholder="Why this goal matters..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Priority</label>
                <select
                  value={goalPriority}
                  onChange={(e) => setGoalPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Initial Milestones (one per line)
              </label>
              <textarea
                rows={3}
                value={goalMilestonesDraft}
                onChange={(e) => setGoalMilestonesDraft(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                placeholder={'Finish all lab assignments on time\nComplete 5 mock tests before finals'}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Save Goal
              </button>
            </div>
          </form>
        )}

        {filteredGoals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center">
            <Target className="w-9 h-9 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No goals in this view yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Break academic, exam, career, and skill goals into concrete milestones that auto-track progress.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {goal.category} · {goal.priority}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{goal.description}</p>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                      Target: {formatReadableDate(goal.targetDateISO)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {goal.progressPct}%
                    </span>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      aria-label="Delete goal"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      goal.progressPct >= 100 ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${goal.progressPct}%` }}
                  />
                </div>

                {/* Milestones */}
                <div className="space-y-2">
                  {goal.milestones.map((ms) => (
                    <div key={ms.id} className="flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          updateGoal(goal.id, {
                            milestones: goal.milestones.map((m) =>
                              m.id === ms.id ? { ...m, completed: !m.completed } : m
                            ),
                          })
                        }
                        className="flex items-center gap-2 text-left flex-1 min-w-0"
                      >
                        {ms.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            ms.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {ms.title}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          updateGoal(goal.id, {
                            milestones: goal.milestones.filter((m) => m.id !== ms.id),
                          })
                        }
                        className="text-slate-400 hover:text-rose-500"
                        aria-label="Remove milestone"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      value={newMilestoneByGoal[goal.id] || ''}
                      onChange={(e) =>
                        setNewMilestoneByGoal((prev) => ({ ...prev, [goal.id]: e.target.value }))
                      }
                      placeholder="Add milestone..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddMilestone(goal)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                    <select
                      value={goal.status}
                      onChange={(e) =>
                        updateGoal(goal.id, { status: e.target.value as PlannerGoal['status'] })
                      }
                      className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'habits') {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span>Daily Habit & Routine Tracker</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Build study consistency with verified check-ins. Streaks reflect real consecutive check-ins only.
            </p>
          </div>

          <form onSubmit={handleCreateHabit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <input
              type="text"
              required
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="New habit (e.g., Solve 2 DSA problems, Revise 30m notes)"
              className="sm:col-span-6 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={habitNote}
              onChange={(e) => setHabitNote(e.target.value)}
              placeholder="Optional target note (e.g., Before 9 PM)"
              className="sm:col-span-4 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Habit</span>
            </button>
          </form>
        </div>

        {habits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center">
            <Flame className="w-9 h-9 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No habits tracked yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add your first daily routine above to start tracking real streaks and 30-day completion history.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const streak = computeHabitStreak(habit.completedDates);
              const checkedToday = habit.completedDates.includes(todayISO);
              const completed30 = habit.completedDates.filter(
                (d) => d >= addDaysToISO(todayISO, -29) && d <= todayISO
              ).length;
              const isExpanded = expandedHabitId === habit.id;

              return (
                <div
                  key={habit.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{habit.name}</h3>
                      {habit.targetNote && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{habit.targetNote}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs font-semibold tabular-nums">
                        <span className="text-orange-600 dark:text-orange-400">
                          Current streak: {streak} {streak === 1 ? 'day' : 'days'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Last 30 days: {completed30} check-in(s)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleHabitDate(habit.id, todayISO)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          checkedToday
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{checkedToday ? 'Done Today' : 'Check In Today'}</span>
                      </button>
                      <button
                        onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {isExpanded ? 'Hide 28d' : '28d History'}
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        aria-label="Delete habit"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 7-day rolling bar */}
                  <div className="grid grid-cols-7 gap-2">
                    {last7Days.map((dayISO) => {
                      const done = habit.completedDates.includes(dayISO);
                      const shortDay = new Date(
                        Number(dayISO.slice(0, 4)),
                        Number(dayISO.slice(5, 7)) - 1,
                        Number(dayISO.slice(8, 10))
                      ).toLocaleDateString(undefined, { weekday: 'short' });
                      return (
                        <button
                          key={dayISO}
                          onClick={() => toggleHabitDate(habit.id, dayISO)}
                          className={`p-2 rounded-xl border text-center transition-colors ${
                            done
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <div className="text-[10px] font-semibold uppercase">{shortDay}</div>
                          <div className="text-xs font-bold mt-0.5 tabular-nums">{dayISO.slice(8, 10)}</div>
                        </button>
                      );
                    })}
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        28-Day Completion Calendar (Click any day to toggle)
                      </p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {last28Days.map((d) => {
                          const done = habit.completedDates.includes(d);
                          return (
                            <button
                              key={d}
                              onClick={() => toggleHabitDate(habit.id, d)}
                              title={formatReadableDate(d)}
                              className={`py-1.5 rounded-lg text-[11px] font-semibold tabular-nums ${
                                done
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {d.slice(5)}
                            </button>
                          );
                        })}
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
  }

  // FOCUS MODE
  const minsDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secsDisplay = String(secondsLeft % 60).padStart(2, '0');
  const progressPct = plannedMinutes > 0 ? Math.round((elapsedSeconds / (plannedMinutes * 60)) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Distraction-Free Timer */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {focusModeType} · {selectedPresetLabel}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Distraction-Free Focus Timer
            </h2>
          </div>
          <Timer className="w-6 h-6 text-blue-600" />
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {FOCUS_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => selectPreset(p.label, p.minutes, p.mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                selectedPresetLabel === p.label
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom length */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Custom minutes:</label>
          <input
            type="number"
            min={1}
            max={180}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white tabular-nums"
          />
          <button
            type="button"
            onClick={applyCustomTimer}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Set Custom
          </button>
        </div>

        {/* Clock Display */}
        <div className="py-8 px-4 rounded-2xl bg-slate-950 text-white text-center space-y-4">
          <div className="text-6xl sm:text-7xl font-black tracking-tight tabular-nums">
            {minsDisplay}:{secsDisplay}
          </div>
          <div className="max-w-md mx-auto h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-slate-400 tabular-nums">
            Elapsed: {elapsedMinutes}m of {plannedMinutes}m · Recorded only upon completion or confirmation
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isRunning ? (
            <button
              onClick={() => {
                setConfirmEarlyNotice(false);
                setIsRunning(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
            >
              <Play className="w-4 h-4" />
              <span>{elapsedSeconds > 0 ? 'Resume' : 'Start Focus'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}
          <button
            onClick={() => {
              setIsRunning(false);
              completedNaturallyRef.current = false;
              setConfirmEarlyNotice(false);
              setSecondsLeft(plannedMinutes * 60);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleExplicitCompleteSession}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete & Record Session</span>
          </button>
        </div>

        {confirmEarlyNotice && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
              Less than 1 minute has elapsed. Click Confirm Log to record a minimum 1-minute session, or continue timer.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleExplicitCompleteSession}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold"
              >
                Confirm Log
              </button>
              <button
                onClick={() => setConfirmEarlyNotice(false)}
                className="px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-semibold text-amber-800 dark:text-amber-200"
              >
                Keep Focusing
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Session Focus Notes
          </label>
          <textarea
            rows={3}
            value={focusNotes}
            onChange={(e) => setFocusNotes(e.target.value)}
            placeholder="Capture what you are working on or key takeaways..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Recorded Focus History */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Recorded Focus History</h3>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {focusSessions.reduce((sum, f) => sum + f.actualMinutes, 0)}m total
          </span>
        </div>

        {focusSessions.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Timer className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No focus sessions recorded yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete a timer block to record real focus minutes here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {focusSessions.map((fs) => (
              <div
                key={fs.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-white">
                    {fs.mode} · {fs.presetLabel}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{fs.actualMinutes}m</span>
                </div>
                {fs.notes && <p className="text-xs text-slate-600 dark:text-slate-300">{fs.notes}</p>}
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {new Date(fs.completedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
