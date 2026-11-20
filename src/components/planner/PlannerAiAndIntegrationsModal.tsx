import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import {
  RECURRENCE_RULES,
  REMINDER_OFFSETS,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  formatReadableDate,
  todayLocalISO,
} from '../../data/plannerData';
import type {
  AiPlannerDraftItem,
  AiPlannerDraftPlan,
  RecurrenceRule,
  ReminderOffset,
  TaskCategory,
  TaskPriority,
} from '../../types/planner';

const AI_WORKFLOW_PROMPTS: Array<{ id: string; label: string; defaultPrompt: string }> = [
  {
    id: 'weekly-study-plan',
    label: 'Create weekly study plan',
    defaultPrompt: 'Create a balanced 7-day study plan around my upcoming tasks and exams.',
  },
  {
    id: 'organize-today',
    label: "Organize today's tasks",
    defaultPrompt: 'Organize my highest priority tasks for today into realistic time blocks.',
  },
  {
    id: 'break-goal',
    label: 'Break down a goal',
    defaultPrompt: 'Break down my active academic or career goal into concrete actionable milestones.',
  },
  {
    id: 'exam-revision',
    label: 'Exam revision schedule',
    defaultPrompt: 'Build an exam revision and practice test schedule before my exam dates.',
  },
  {
    id: 'balanced-timetable',
    label: 'Balanced timetable',
    defaultPrompt: 'Suggest a sustainable daily study and self-care timetable with buffer blocks.',
  },
  {
    id: 'overloaded-days',
    label: 'Identify overloaded days',
    defaultPrompt: 'Inspect my upcoming workload and suggest how to redistribute overloaded days.',
  },
  {
    id: 'reschedule-unfinished',
    label: 'Reschedule unfinished tasks',
    defaultPrompt: 'Propose clean recovery slots over the next 3 days for unfinished or overdue tasks.',
  },
];

export const PlannerAiAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { generateAiPlannerDraft, applyAiDraftToPlanner } = usePlanner();
  const [selectedWorkflow, setSelectedWorkflow] = useState(AI_WORKFLOW_PROMPTS[0].id);
  const [promptText, setPromptText] = useState(AI_WORKFLOW_PROMPTS[0].defaultPrompt);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiPlannerDraftPlan | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMsg(null);
    const res = await generateAiPlannerDraft(selectedWorkflow, promptText);
    setGenerating(false);
    if (!res.ok || !res.draft) {
      setErrorMsg(res.error || 'KAMPUS AI Planner Assistant is currently unavailable.');
      return;
    }
    setDraft(res.draft);
  };

  const updateDraftItem = (itemId: string, patch: Partial<AiPlannerDraftItem>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      items: draft.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    });
  };

  const removeDraftItem = (itemId: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      items: draft.items.filter((it) => it.id !== itemId),
    });
  };

  const handleConfirmApply = async () => {
    if (!draft) return;
    setApplying(true);
    await applyAiDraftToPlanner(draft);
    setApplying(false);
    setDraft(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span>KAMPUS AI Planner Assistant</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              Editable Draft Schedule Assistant
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              AI suggestions appear as an editable preview first. Nothing is added to your planner unless you confirm.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7 Preset Workflows */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Choose Planning Workflow
          </label>
          <div className="flex flex-wrap gap-2">
            {AI_WORKFLOW_PROMPTS.map((wf) => (
              <button
                key={wf.id}
                type="button"
                onClick={() => {
                  setSelectedWorkflow(wf.id);
                  setPromptText(wf.defaultPrompt);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedWorkflow === wf.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {wf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Customize Instructions
          </label>
          <textarea
            rows={2}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{generating ? 'Generating Preview...' : 'Generate Preview Draft'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
            {errorMsg}
          </div>
        )}

        {draft && (
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-bold text-blue-950 dark:text-blue-100">{draft.summaryTitle}</h4>
              {draft.adviceNote && (
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">{draft.adviceNote}</p>
              )}
            </div>

            <div className="space-y-2.5">
              {draft.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => updateDraftItem(item.id, { selected: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateDraftItem(item.id, { title: e.target.value })}
                      className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeDraftItem(item.id)}
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pl-6">
                    <select
                      value={item.category}
                      onChange={(e) => updateDraftItem(item.id, { category: e.target.value as TaskCategory })}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                    >
                      {TASK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={item.dateISO}
                      onChange={(e) => updateDraftItem(item.id, { dateISO: e.target.value })}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] tabular-nums"
                    />
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => updateDraftItem(item.id, { startTime: e.target.value })}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] tabular-nums"
                    />
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => updateDraftItem(item.id, { endTime: e.target.value })}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] tabular-nums"
                    />
                    <select
                      value={item.priority}
                      onChange={(e) => updateDraftItem(item.id, { priority: e.target.value as TaskPriority })}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Discard Draft
              </button>
              <button
                type="button"
                disabled={applying || !draft.items.some((i) => i.selected)}
                onClick={handleConfirmApply}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {applying
                    ? 'Applying...'
                    : `Confirm & Apply (${draft.items.filter((i) => i.selected).length})`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const PlannerIntegrationsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { integrations, partnerSessions, importIntegrationItem } = usePlanner();
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string>('All');

  if (!isOpen) return null;

  const filtered = integrations.filter(
    (it) => moduleFilter === 'All' || it.sourceModule === moduleFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Link2 className="w-4 h-4" />
              <span>KAMPUS Ecosystem Sync</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              Connect Activities from Other KAMPUS Modules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Import live deadlines, events, study sessions, and locker reminders without leaving your Planner.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', 'Study Hub', 'Career', 'Events & Clubs', 'College Explorer', 'Digital Locker'].map(
            (mod) => (
              <button
                key={mod}
                onClick={() => setModuleFilter(mod)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                  moduleFilter === mod
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {mod}
              </button>
            )
          )}
        </div>

        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
              No live items found for this module filter.
            </p>
          ) : (
            filtered.map((item) => {
              const isImported = importedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {item.sourceModule} · {item.kind}
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                      {item.subtitle} · {formatReadableDate(item.dateISO)} at {item.time}
                    </p>
                  </div>
                  <button
                    disabled={isImported}
                    onClick={async () => {
                      await importIntegrationItem(item);
                      setImportedIds((prev) => [...prev, item.id]);
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${
                      isImported
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isImported ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isImported ? 'Added' : 'Add to Planner'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {partnerSessions.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Synced Study Partner & AI Session Hooks ({partnerSessions.length})
            </h4>
            <div className="space-y-1.5">
              {partnerSessions.slice(0, 5).map((ps) => (
                <div
                  key={ps.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <span className="font-semibold truncate">{ps.title}</span>
                  <span className="text-slate-400 tabular-nums shrink-0">
                    {ps.dateISO} · {ps.timeSlot}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const PlannerQuickTaskModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { createTask } = usePlanner();
  const todayISO = todayLocalISO();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Study');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDateISO, setDueDateISO] = useState(todayISO);
  const [dueTime, setDueTime] = useState('18:00');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('None');
  const [reminderOffset, setReminderOffset] = useState<ReminderOffset>('15 minutes before');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      dueDateISO: dueDateISO || todayISO,
      dueTime: dueTime || '18:00',
      estimatedMinutes: Number(estimatedMinutes) || 45,
      recurrence,
      reminderOffset,
    });
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Create New Task</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Task Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Submit Compiler Design Lab 4"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details, links, or checklist summary..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDateISO}
              onChange={(e) => setDueDateISO(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Due Time</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Repeat</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceRule)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {RECURRENCE_RULES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Reminder</label>
            <select
              value={reminderOffset}
              onChange={(e) => setReminderOffset(e.target.value as ReminderOffset)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {REMINDER_OFFSETS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            min={5}
            max={480}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white tabular-nums"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
};
