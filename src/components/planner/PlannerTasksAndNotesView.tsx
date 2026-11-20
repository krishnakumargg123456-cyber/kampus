import React, { useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Circle,
  Copy,
  Edit3,
  ExternalLink,
  Paperclip,
  Pin,
  Plus,
  Repeat,
  Search,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlanner } from '../../context/PlannerContext';
import {
  CATEGORY_COLOR_MAP,
  NOTE_TYPES,
  RECURRENCE_RULES,
  REMINDER_OFFSETS,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  addDaysToISO,
  formatReadableDate,
  todayLocalISO,
} from '../../data/plannerData';
import type {
  PlannerNote,
  PlannerNoteType,
  PlannerSubtask,
  PlannerTask,
  RecurrenceRule,
  ReminderOffset,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../types/planner';

interface Props {
  mode: 'tasks' | 'notes';
}

type TaskViewFilter = 'All' | 'Today' | 'Upcoming' | 'Overdue' | 'Completed' | 'My Tasks';

export const PlannerTasksAndNotesView: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const {
    tasks,
    createTask,
    updateTask,
    duplicateTask,
    deleteTask,
    notes,
    createNote,
    updateNote,
    deleteNote,
  } = usePlanner();

  const todayISO = todayLocalISO();

  // Task filters
  const [viewFilter, setViewFilter] = useState<TaskViewFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | TaskCategory>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'recent'>('deadline');

  // Task Create/Edit Modal
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tCat, setTCat] = useState<TaskCategory>('Study');
  const [tPrio, setTPrio] = useState<TaskPriority>('Medium');
  const [tStatus, setTStatus] = useState<TaskStatus>('To Do');
  const [tDue, setTDue] = useState(todayISO);
  const [tTime, setTTime] = useState('18:00');
  const [tMins, setTMins] = useState(45);
  const [tRecurrence, setTRecurrence] = useState<RecurrenceRule>('None');
  const [tCustomDays, setTCustomDays] = useState(3);
  const [tReminderOffset, setTReminderOffset] = useState<ReminderOffset>('15 minutes before');
  const [tTagsText, setTTagsText] = useState('');
  const [tAttachment, setTAttachment] = useState('');
  const [tSubtasks, setTSubtasks] = useState<PlannerSubtask[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Notes state
  const [noteSearch, setNoteSearch] = useState('');
  const [noteTypeFilter, setNoteTypeFilter] = useState<'All' | PlannerNoteType>('All');
  const [editingNote, setEditingNote] = useState<PlannerNote | null>(null);
  const [nTitle, setNTitle] = useState('');
  const [nContent, setNContent] = useState('');
  const [nType, setNType] = useState<PlannerNoteType>('Quick');
  const [nSubject, setNSubject] = useState('');

  const openNewTaskModal = () => {
    setEditingTask(null);
    setTTitle('');
    setTDesc('');
    setTCat('Study');
    setTPrio('Medium');
    setTStatus('To Do');
    setTDue(todayISO);
    setTTime('18:00');
    setTMins(45);
    setTRecurrence('None');
    setTCustomDays(3);
    setTReminderOffset('15 minutes before');
    setTTagsText('');
    setTAttachment('');
    setTSubtasks([]);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: PlannerTask) => {
    setEditingTask(task);
    setTTitle(task.title);
    setTDesc(task.description);
    setTCat(task.category);
    setTPrio(task.priority);
    setTStatus(task.status);
    setTDue(task.dueDateISO);
    setTTime(task.dueTime);
    setTMins(task.estimatedMinutes);
    setTRecurrence(task.recurrence);
    setTCustomDays(task.customIntervalDays || 3);
    setTReminderOffset(task.reminderOffset);
    setTTagsText(task.tags.join(', '));
    setTAttachment(task.attachmentLabel || '');
    setTSubtasks(task.subtasks || []);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    const payload = {
      title: tTitle.trim(),
      description: tDesc.trim(),
      category: tCat,
      priority: tPrio,
      status: tStatus,
      dueDateISO: tDue,
      dueTime: tTime,
      estimatedMinutes: tMins,
      recurrence: tRecurrence,
      customIntervalDays: tRecurrence === 'Custom' ? tCustomDays : undefined,
      reminderOffset: tReminderOffset,
      tags: tTagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      attachmentLabel: tAttachment.trim() || undefined,
      subtasks: tSubtasks,
    };

    if (editingTask) {
      await updateTask(editingTask.id, payload);
    } else {
      await createTask(payload);
    }
    setIsTaskModalOpen(false);
  };

  const filteredTasks = useMemo(() => {
    const prioWeight: Record<TaskPriority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    return tasks
      .filter((t) => {
        if (viewFilter === 'Today' && t.dueDateISO !== todayISO) return false;
        if (viewFilter === 'Upcoming' && (t.dueDateISO <= todayISO || t.status === 'Completed')) return false;
        if (viewFilter === 'Overdue' && (t.dueDateISO >= todayISO || t.status === 'Completed' || t.status === 'Cancelled')) return false;
        if (viewFilter === 'Completed' && t.status !== 'Completed') return false;
        if (viewFilter === 'My Tasks' && Boolean(t.sourceModule)) return false;
        if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
        if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some((tg) => tg.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return prioWeight[b.priority] - prioWeight[a.priority];
        if (sortBy === 'recent') return b.createdAt.localeCompare(a.createdAt);
        return `${a.dueDateISO} ${a.dueTime}`.localeCompare(`${b.dueDateISO} ${b.dueTime}`);
      });
  }, [tasks, viewFilter, todayISO, categoryFilter, priorityFilter, searchQuery, sortBy]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (noteTypeFilter !== 'All' && n.noteType !== noteTypeFilter) return false;
        if (noteSearch.trim()) {
          const q = noteSearch.toLowerCase();
          if (
            !n.title.toLowerCase().includes(q) &&
            !n.content.toLowerCase().includes(q) &&
            !(n.linkedSubject || '').toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, noteTypeFilter, noteSearch]);

  if (mode === 'notes') {
    const startEditNote = (note: PlannerNote) => {
      setEditingNote(note);
      setNTitle(note.title);
      setNContent(note.content);
      setNType(note.noteType);
      setNSubject(note.linkedSubject || '');
    };

    const handleNoteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nContent.trim()) return;
      if (editingNote) {
        await updateNote(editingNote.id, {
          title: nTitle.trim() || nContent.trim().slice(0, 40),
          content: nContent.trim(),
          noteType: nType,
          linkedSubject: nSubject.trim() || undefined,
        });
        setEditingNote(null);
      } else {
        await createNote({
          title: nTitle.trim() || nContent.trim().slice(0, 40),
          content: nContent.trim(),
          noteType: nType,
          linkedSubject: nSubject.trim() || undefined,
        });
      }
      setNTitle('');
      setNContent('');
      setNSubject('');
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-blue-600" />
              Planner Notes & Quick Capture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lightweight scratchpad for meetings, study takeaways, and task checklists. For full course notes, open Study Hub.
            </p>
          </div>
          <button
            onClick={() => navigate('/learn/study-hub')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-blue-600 inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Study Hub Notes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleNoteSubmit}
            className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 h-fit text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingNote ? 'Edit Note' : 'Capture New Note'}
              </h3>
              {editingNote && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNote(null);
                    setNTitle('');
                    setNContent('');
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>
            <input
              type="text"
              value={nTitle}
              onChange={(e) => setNTitle(e.target.value)}
              placeholder="Note title"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={nType}
                onChange={(e) => setNType(e.target.value as PlannerNoteType)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {NOTE_TYPES.map((nt) => (
                  <option key={nt} value={nt}>
                    {nt} Note
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={nSubject}
                onChange={(e) => setNSubject(e.target.value)}
                placeholder="Subject (optional)"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <textarea
              rows={5}
              required
              value={nContent}
              onChange={(e) => setNContent(e.target.value)}
              placeholder="Write your notes here..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {editingNote ? 'Update Note' : 'Save Note'}
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', ...NOTE_TYPES] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNoteTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      noteTypeFilter === t
                        ? 'bg-slate-900 dark:bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder="Search notes..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No notes yet. Capture a quick meeting, study, or personal note on the left.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNotes.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border space-y-2 ${
                      n.pinned
                        ? 'border-blue-400 dark:border-blue-600'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {n.noteType} {n.linkedSubject ? `· ${n.linkedSubject}` : ''}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateNote(n.id, { pinned: !n.pinned })}
                          className={`p-1 rounded-lg ${
                            n.pinned ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title="Pin note"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEditNote(n)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteNote(n.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tasks View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Task & Reminder Workspace
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize coursework, subtasks, recurring routines, and snoozable reminders synced with Notification Center.
          </p>
        </div>
        <button
          onClick={openNewTaskModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* View Filter Tabs + Search/Sort Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Today', 'Upcoming', 'Overdue', 'Completed', 'My Tasks'] as TaskViewFilter[]).map((vf) => (
            <button
              key={vf}
              onClick={() => setViewFilter(vf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewFilter === vf
                  ? 'bg-slate-900 dark:bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {vf}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or tags..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | TaskCategory)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="All">All Categories</option>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'All' | TaskPriority)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="All">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'deadline' | 'priority' | 'recent')}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="priority">Sort by Priority</option>
            <option value="recent">Sort by Recently Added</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No tasks match your current view
          </p>
          <p className="text-xs text-slate-500">
            Create a task with subtasks, recurring cadence, and reminder offsets to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'Completed';
            const isOverdue = !isDone && task.status !== 'Cancelled' && task.dueDateISO < todayISO;
            const catStyle = CATEGORY_COLOR_MAP[task.category] || CATEGORY_COLOR_MAP.Other;

            return (
              <div
                key={task.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() =>
                        updateTask(task.id, { status: isDone ? 'To Do' : 'Completed' })
                      }
                      className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                        <span className={catStyle.text}>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            task.priority === 'Urgent' || task.priority === 'High'
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-slate-500'
                          }
                        >
                          {task.priority}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500">{task.status}</span>
                        {task.recurrence !== 'None' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-blue-600">
                              <Repeat className="w-3 h-3" />
                              {task.recurrence}
                            </span>
                          </>
                        )}
                      </div>
                      <h3
                        className={`text-sm sm:text-base font-bold ${
                          isDone
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 tabular-nums pt-0.5">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                          Due {formatReadableDate(task.dueDateISO)} at {task.dueTime}
                          {isOverdue ? ' (Overdue)' : ''}
                        </span>
                        <span>· {task.estimatedMinutes} min est.</span>
                        {task.attachmentLabel && (
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            {task.attachmentLabel}
                          </span>
                        )}
                        {task.tags.length > 0 && <span>Tags: {task.tags.join(', ')}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Reminder Snooze/Dismiss + Duplicate/Edit/Delete */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {!isDone && task.reminderState !== 'Dismissed' && (
                      <>
                        <button
                          onClick={() =>
                            updateTask(task.id, {
                              dueDateISO: addDaysToISO(task.dueDateISO, 1),
                              reminderState: 'Snoozed',
                              snoozedUntilISO: addDaysToISO(task.dueDateISO, 1),
                            })
                          }
                          title="Snooze reminder +1 day"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 hover:border-blue-400"
                        >
                          <Bell className="w-3 h-3 text-blue-600" />
                          Snooze 1d
                        </button>
                        <button
                          onClick={() => updateTask(task.id, { reminderState: 'Dismissed' })}
                          title="Dismiss reminder"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
                        >
                          <BellOff className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => duplicateTask(task.id)}
                      title="Duplicate task"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditTaskModal(task)}
                      title="Edit task"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      title="Delete task"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Subtasks */}
                {task.subtasks.length > 0 && (
                  <div className="pl-8 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    {task.subtasks.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() =>
                          updateTask(task.id, {
                            subtasks: task.subtasks.map((s) =>
                              s.id === sub.id ? { ...s, completed: !s.completed } : s
                            ),
                          })
                        }
                        className="flex items-center gap-2 text-xs text-left text-slate-700 dark:text-slate-300"
                      >
                        {sub.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                          {sub.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Create/Edit Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveTask}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              placeholder="Task title (e.g. Complete OS Lab 3 Report)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
            />
            <textarea
              rows={2}
              value={tDesc}
              onChange={(e) => setTDesc(e.target.value)}
              placeholder="Description or notes"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />

            <div className="grid grid-cols-3 gap-2">
              <select
                value={tCat}
                onChange={(e) => setTCat(e.target.value as TaskCategory)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={tPrio}
                onChange={(e) => setTPrio(e.target.value as TaskPriority)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={tStatus}
                onChange={(e) => setTStatus(e.target.value as TaskStatus)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="date"
                value={tDue}
                onChange={(e) => setTDue(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
              <input
                type="time"
                value={tTime}
                onChange={(e) => setTTime(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
              <input
                type="number"
                min={5}
                value={tMins}
                onChange={(e) => setTMins(Number(e.target.value))}
                placeholder="Est. mins"
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={tRecurrence}
                onChange={(e) => setTRecurrence(e.target.value as RecurrenceRule)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {RECURRENCE_RULES.map((r) => (
                  <option key={r} value={r}>
                    Repeat: {r}
                  </option>
                ))}
              </select>
              <select
                value={tReminderOffset}
                onChange={(e) => setTReminderOffset(e.target.value as ReminderOffset)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {REMINDER_OFFSETS.map((o) => (
                  <option key={o} value={o}>
                    Remind: {o}
                  </option>
                ))}
              </select>
            </div>

            {tRecurrence === 'Custom' && (
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                Custom repeat interval (days):
                <input
                  type="number"
                  min={1}
                  value={tCustomDays}
                  onChange={(e) => setTCustomDays(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                />
              </label>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={tTagsText}
                onChange={(e) => setTTagsText(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <input
                type="text"
                value={tAttachment}
                onChange={(e) => setTAttachment(e.target.value)}
                placeholder="Attachment / Locker file ref"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            {/* Subtasks Builder */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="font-bold text-slate-700 dark:text-slate-200">Subtasks</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  placeholder="Add a subtask step..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubtaskInput.trim()) return;
                    setTSubtasks((prev) => [
                      ...prev,
                      { id: `sub_${Date.now()}`, title: newSubtaskInput.trim(), completed: false },
                    ]);
                    setNewSubtaskInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold"
                >
                  Add
                </button>
              </div>
              {tSubtasks.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg">
                  <span>{s.title}</span>
                  <button
                    type="button"
                    onClick={() => setTSubtasks((prev) => prev.filter((x) => x.id !== s.id))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
