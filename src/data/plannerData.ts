import type {
  DayOfWeek,
  ExamRecordType,
  GoalCategory,
  PlannerNoteType,
  RecurrenceRule,
  ReminderOffset,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TimetableSlotType,
} from '../types/planner';

export const TASK_CATEGORIES: TaskCategory[] = [
  'Study',
  'Assignments',
  'Examinations',
  'Projects',
  'Career',
  'Personal',
  'College',
  'Other',
];

export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export const TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Completed', 'Cancelled'];

export const RECURRENCE_RULES: RecurrenceRule[] = ['None', 'Daily', 'Weekly', 'Monthly', 'Custom'];

export const REMINDER_OFFSETS: ReminderOffset[] = [
  'At event time',
  '5 minutes before',
  '15 minutes before',
  '30 minutes before',
  '1 day before',
  'Custom',
];

export const GOAL_CATEGORIES: GoalCategory[] = [
  'Academic Goals',
  'Exam Preparation',
  'Career Goals',
  'Skill Development',
  'Personal Goals',
  'Habit Goals',
];

export const EXAM_RECORD_TYPES: ExamRecordType[] = [
  'Board Examination',
  'University Examination',
  'Competitive Examination',
  'Internal Assessment',
  'Practical Examination',
  'Assignment Deadline',
  'Project Submission',
  'Admission Deadline',
];

export const NOTE_TYPES: PlannerNoteType[] = ['Quick', 'Meeting', 'Study', 'Task', 'Personal'];

export const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TIMETABLE_SLOT_TYPES: TimetableSlotType[] = ['Lecture', 'Practical', 'Break', 'Self-Study'];

export const FOCUS_PRESETS = [
  { label: '25 min Pomodoro', minutes: 25, mode: 'Focus' as const },
  { label: '45 min Deep Work', minutes: 45, mode: 'Focus' as const },
  { label: '50 min Lecture Sprint', minutes: 50, mode: 'Focus' as const },
  { label: '60 min Exam Block', minutes: 60, mode: 'Focus' as const },
  { label: '5 min Short Break', minutes: 5, mode: 'Short Break' as const },
  { label: '15 min Long Break', minutes: 15, mode: 'Long Break' as const },
];

export const CATEGORY_COLOR_MAP: Record<TaskCategory, { dot: string; text: string; bg: string; border: string }> = {
  Study: {
    dot: 'bg-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
  },
  Assignments: {
    dot: 'bg-indigo-600',
    text: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  Examinations: {
    dot: 'bg-rose-600',
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
  },
  Projects: {
    dot: 'bg-violet-600',
    text: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-800',
  },
  Career: {
    dot: 'bg-orange-600',
    text: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
  },
  Personal: {
    dot: 'bg-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  College: {
    dot: 'bg-sky-600',
    text: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
  },
  Other: {
    dot: 'bg-slate-600',
    text: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToISO(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function formatReadableDate(iso: string): string {
  if (!iso) return 'Unscheduled';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntilDate(iso: string): number {
  const today = todayLocalISO();
  const [ty, tm, td] = today.split('-').map(Number);
  const [y, m, d] = iso.split('-').map(Number);
  const t0 = new Date(ty, (tm || 1) - 1, td || 1).getTime();
  const t1 = new Date(y, (m || 1) - 1, d || 1).getTime();
  return Math.round((t1 - t0) / 86400_000);
}

export function getDayOfWeekFromISO(iso: string): DayOfWeek {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const idx = dt.getDay(); // 0 Sun .. 6 Sat
  const map: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[idx] || 'Mon';
}

export function computeHabitStreak(completedDates: string[]): number {
  if (!completedDates.length) return 0;
  const set = new Set(completedDates);
  const today = todayLocalISO();
  const yesterday = addDaysToISO(today, -1);
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : '';
  if (!cursor) return 0;
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDaysToISO(cursor, -1);
  }
  return streak;
}
