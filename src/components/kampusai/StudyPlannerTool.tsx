import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Loader2,
  Sparkles,
  CheckSquare,
  Square,
  RotateCcw,
  Bookmark,
  Check,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import { StudyPlanOutput } from '../../types/kampusAi';
import { runStructuredAiTool } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';

export const StudyPlannerTool: React.FC = () => {
  const navigate = useNavigate();
  const {
    preferences,
    addHistoryEntry,
    saveItem,
    saveStudyPlanToPlanner,
    pendingReopenData,
    clearPendingReopenData,
  } = useKampusAi();

  const [goals, setGoals] = useState('Score 9+ SPI and finish Mid-Sem syllabus with 2 full revision passes');
  const [subjects, setSubjects] = useState('Algorithms, DBMS, Distributed Systems, Linear Algebra');
  const [availableHours, setAvailableHours] = useState('3.5 hours on weekdays, 6 hours on weekends');
  const [deadlines, setDeadlines] = useState('DBMS Mid-Sem in 4 days, Algorithms Exam in 7 days');
  const [weakSubjects, setWeakSubjects] = useState('Tree Dynamic Programming, Query Optimization');
  const [preferredSchedule, setPreferredSchedule] = useState('Evening study blocks (5 PM - 10 PM) + 1 hour morning revision');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<StudyPlanOutput | null>(null);
  const [syncedToPlanner, setSyncedToPlanner] = useState(false);
  const [savedCollection, setSavedCollection] = useState(false);

  const [newTaskSlot, setNewTaskSlot] = useState('');
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    if (pendingReopenData?.toolId === 'planner') {
      const p = pendingReopenData.payload || {};
      if (p.plan) setPlan(p.plan);
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  const generatePlan = async () => {
    setError(null);
    setLoading(true);
    setSyncedToPlanner(false);
    setSavedCollection(false);
    try {
      const raw = await runStructuredAiTool<any>('study-planner', {
        goals,
        subjects,
        availableHours,
        deadlines,
        weakSubjects,
        preferredSchedule,
        language: preferences.language,
      });

      const normalized: StudyPlanOutput = {
        ...raw,
        dailyPlan: (raw.dailyPlan || []).map((t: any, idx: number) => ({
          id: t.id || `task_${Date.now()}_${idx}`,
          timeSlot: t.timeSlot || 'Flexible',
          task: t.task || '',
          subject: t.subject || 'General',
          type: t.type || 'Study',
          completed: Boolean(t.completed),
        })),
      };

      setPlan(normalized);
      addHistoryEntry({
        category: 'Study Plans',
        toolId: 'planner',
        title: normalized.title || 'AI Study Plan',
        subtitle: `${normalized.dailyPlan.length} scheduled blocks · ${subjects.split(',')[0]}`,
        payload: { plan: normalized },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate study plan.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      dailyPlan: plan.dailyPlan.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    });
  };

  const updateTaskText = (id: string, task: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      dailyPlan: plan.dailyPlan.map((t) => (t.id === id ? { ...t, task } : t)),
    });
  };

  const removeTask = (id: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      dailyPlan: plan.dailyPlan.filter((t) => t.id !== id),
    });
  };

  const addCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !newTaskText.trim()) return;
    setPlan({
      ...plan,
      dailyPlan: [
        ...plan.dailyPlan,
        {
          id: `custom_${Date.now()}`,
          timeSlot: newTaskSlot.trim() || 'Flexible Slot',
          task: newTaskText.trim(),
          subject: 'Custom',
          type: 'Study',
          completed: false,
        },
      ],
    });
    setNewTaskSlot('');
    setNewTaskText('');
  };

  return (
    <div className="space-y-6">
      <AiStatusBanner compact={!error} errorOverride={error} onRetry={generatePlan} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          generatePlan();
        }}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              AI Smart Study Planner
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Build an editable daily & weekly schedule and sync it straight into KAMPUS Planner.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Study Goals
            </label>
            <input
              type="text"
              required
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subjects
            </label>
            <input
              type="text"
              required
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Available Hours
            </label>
            <input
              type="text"
              required
              value={availableHours}
              onChange={(e) => setAvailableHours(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Deadlines
            </label>
            <input
              type="text"
              required
              value={deadlines}
              onChange={(e) => setDeadlines(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Weak Subjects / Priority Topics
            </label>
            <input
              type="text"
              value={weakSubjects}
              onChange={(e) => setWeakSubjects(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preferred Study Schedule
            </label>
            <input
              type="text"
              value={preferredSchedule}
              onChange={(e) => setPreferredSchedule(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Creating Study Plan...' : 'Generate Study Plan'}</span>
          </button>
        </div>
      </form>

      {plan && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {plan.title}
              </h3>
              <p className="text-xs text-slate-500 tabular-nums">
                {plan.dailyPlan.filter((t) => t.completed).length} of {plan.dailyPlan.length} daily tasks completed
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generatePlan}
                disabled={loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  saveItem({
                    collection: 'Study Plans',
                    title: plan.title,
                    summary: `${plan.dailyPlan.length} study blocks · ${subjects}`,
                    toolId: 'planner',
                    data: { plan },
                  });
                  setSavedCollection(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {savedCollection ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-orange-500" />}
                <span>{savedCollection ? 'Saved' : 'Save Plan'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  saveStudyPlanToPlanner(plan);
                  setSyncedToPlanner(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                {syncedToPlanner ? <Check className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
                <span>{syncedToPlanner ? 'Saved to KAMPUS Planner' : 'Save to KAMPUS Planner'}</span>
              </button>
              {syncedToPlanner && (
                <button
                  type="button"
                  onClick={() => navigate('/tools/planner')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold cursor-pointer"
                >
                  <span>Open KAMPUS Planner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Editable Daily Plan Checklist */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                Daily Plan (Editable & Interactive)
              </h4>
              <div className="space-y-2">
                {plan.dailyPlan.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 ${
                      item.completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(item.id)}
                      className="mt-0.5 text-blue-600 cursor-pointer shrink-0"
                    >
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-mono font-bold text-blue-600">{item.timeSlot}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-orange-500">{item.subject}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{item.type}</span>
                      </div>
                      <input
                        type="text"
                        value={item.task}
                        onChange={(e) => updateTaskText(item.id, e.target.value)}
                        className={`w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-hidden ${
                          item.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTask(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={addCustomTask} className="flex flex-wrap gap-2 pt-1">
                <input
                  type="text"
                  value={newTaskSlot}
                  onChange={(e) => setNewTaskSlot(e.target.value)}
                  placeholder="Time slot (e.g. 9-10 PM)"
                  className="w-36 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add custom study block..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Right Column: Allocation, Weekly, Revision, Breaks */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Weekly Timetable Overview
                </h4>
                <ul className="list-disc ml-4 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {plan.weeklyTimetable.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  Subject Time Allocation
                </h4>
                <ul className="list-disc ml-4 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {plan.subjectAllocation.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-500">
                  Revision & Practice Sessions
                </h4>
                <ul className="list-disc ml-4 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {[...plan.revisionSessions, ...plan.practiceSessions].map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Break Recommendations
                </h4>
                <ul className="list-disc ml-4 space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
                  {plan.breakRecommendations.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
