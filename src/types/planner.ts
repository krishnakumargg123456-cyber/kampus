export type TaskCategory =
  | 'Study'
  | 'Assignments'
  | 'Examinations'
  | 'Projects'
  | 'Career'
  | 'Personal'
  | 'College'
  | 'Other';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';

export type RecurrenceRule = 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

export type ReminderOffset =
  | 'At event time'
  | '5 minutes before'
  | '15 minutes before'
  | '30 minutes before'
  | '1 day before'
  | 'Custom';

export type ReminderState = 'Active' | 'Snoozed' | 'Dismissed' | 'Completed';

export interface PlannerSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface PlannerTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDateISO: string;
  dueTime: string;
  estimatedMinutes: number;
  subtasks: PlannerSubtask[];
  tags: string[];
  attachmentLabel?: string;
  recurrence: RecurrenceRule;
  customIntervalDays?: number;
  reminderOffset: ReminderOffset;
  customReminderMinutes?: number;
  reminderState: ReminderState;
  snoozedUntilISO?: string | null;
  sourceModule?: string;
  sourceRefId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  category: TaskCategory;
  priority: TaskPriority;
  recurrence: RecurrenceRule;
  reminderOffset: ReminderOffset;
  reminderState: ReminderState;
  location: string;
  description: string;
  completed: boolean;
  sourceModule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlanChapter {
  id: string;
  title: string;
  targetDateISO: string;
  durationMinutes: number;
  kind: 'Study' | 'Revision' | 'Practice Test';
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  userId: string;
  courseOrClass: string;
  subject: string;
  dailyAvailabilityHours: number;
  targetDateISO: string;
  chapters: StudyPlanChapter[];
  createdAt: string;
  updatedAt: string;
}

export interface StudySessionRecord {
  id: string;
  userId: string;
  studyPlanId?: string | null;
  subject: string;
  chapterOrTopic: string;
  plannedMinutes: number;
  actualMinutes: number;
  dateISO: string;
  startTime: string;
  endTime: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Rescheduled';
  createdAt: string;
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type TimetableSlotType = 'Lecture' | 'Practical' | 'Break' | 'Self-Study';

export interface TimetableSlot {
  id: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  slotType: TimetableSlotType;
  room: string;
  instructor: string;
}

export type GoalCategory =
  | 'Academic Goals'
  | 'Exam Preparation'
  | 'Career Goals'
  | 'Skill Development'
  | 'Personal Goals'
  | 'Habit Goals';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface PlannerGoal {
  id: string;
  userId: string;
  category: GoalCategory;
  title: string;
  description: string;
  targetDateISO: string;
  priority: TaskPriority;
  status: 'Active' | 'Completed' | 'Archived';
  milestones: GoalMilestone[];
  progressPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerHabit {
  id: string;
  userId: string;
  name: string;
  targetNote: string;
  completedDates: string[]; // YYYY-MM-DD
  createdAt: string;
}

export type ExamRecordType =
  | 'Board Examination'
  | 'University Examination'
  | 'Competitive Examination'
  | 'Internal Assessment'
  | 'Practical Examination'
  | 'Assignment Deadline'
  | 'Project Submission'
  | 'Admission Deadline';

export interface ExamChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface ExamRecord {
  id: string;
  userId: string;
  examType: ExamRecordType;
  name: string;
  subject: string;
  dateISO: string;
  time: string;
  venue: string;
  prepStatus: 'Not Started' | 'In Progress' | 'Ready';
  checklist: ExamChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FocusSessionRecord {
  id: string;
  userId: string;
  mode: 'Focus' | 'Short Break' | 'Long Break';
  presetLabel: string;
  plannedMinutes: number;
  actualMinutes: number;
  notes: string;
  confirmed: boolean;
  completedAt: string;
}

export type PlannerNoteType = 'Quick' | 'Meeting' | 'Study' | 'Task' | 'Personal';

export interface PlannerNote {
  id: string;
  userId: string;
  noteType: PlannerNoteType;
  title: string;
  content: string;
  pinned: boolean;
  linkedSubject?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EcosystemIntegrationItem {
  id: string;
  sourceModule: 'Study Hub' | 'Career' | 'Events & Clubs' | 'College Explorer' | 'Digital Locker';
  kind: 'Task' | 'Event' | 'Exam' | 'StudySession';
  title: string;
  subtitle: string;
  dateISO: string;
  time: string;
  category: TaskCategory;
}

export interface AiPlannerDraftItem {
  id: string;
  selected: boolean;
  kind: 'Task' | 'Event' | 'StudySession' | 'GoalMilestone';
  title: string;
  category: TaskCategory;
  dateISO: string;
  startTime: string;
  endTime: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  notes: string;
}

export interface AiPlannerDraftPlan {
  requestType: string;
  summaryTitle: string;
  adviceNote: string;
  items: AiPlannerDraftItem[];
}
